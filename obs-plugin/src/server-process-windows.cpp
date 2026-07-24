#include "server-process-windows.hpp"
#include "server-launch-options.hpp"

#include <obs-module.h>

#include <Windows.h>
#include <ShlObj.h>
#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <WinHttp.h>

#include <cstdlib>
#include <filesystem>
#include <limits>
#include <mutex>
#include <string>
#include <vector>

namespace {
constexpr unsigned short kServerPort = 33770;
std::mutex process_mutex;

std::wstring widen(const std::string &value)
{
	if (value.empty())
		return {};
	const int length = MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, nullptr, 0);
	std::wstring result(static_cast<size_t>(length), L'\0');
	MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, result.data(), length);
	result.pop_back();
	return result;
}

std::string narrow(const std::wstring &value)
{
	if (value.empty())
		return {};
	const int length = WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, nullptr, 0, nullptr, nullptr);
	std::string result(static_cast<size_t>(length), '\0');
	WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, result.data(), length, nullptr, nullptr);
	result.pop_back();
	return result;
}

bool read_positive_integer(const std::string &json, const char *field, unsigned int &value)
{
	const std::string key = std::string("\"") + field + "\":";
	const size_t position = json.find(key);
	if (position == std::string::npos)
		return false;
	const char *start = json.c_str() + position + key.size();
	char *end = nullptr;
	const unsigned long parsed = std::strtoul(start, &end, 10);
	if (end == start || parsed == 0 || parsed > std::numeric_limits<unsigned int>::max())
		return false;
	value = static_cast<unsigned int>(parsed);
	return true;
}

bool read_api(const std::string &api_path, std::string &body)
{
	HINTERNET session = WinHttpOpen(L"Myogi-Ban-OBS/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY,
					WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
	if (!session)
		return false;
	HINTERNET connection = WinHttpConnect(session, L"127.0.0.1", kServerPort, 0);
	const std::wstring path = widen(api_path);
	HINTERNET request = connection
				    ? WinHttpOpenRequest(connection, L"GET", path.c_str(), nullptr, nullptr,
							 WINHTTP_DEFAULT_ACCEPT_TYPES, 0)
				    : nullptr;
	bool success = request && WinHttpSendRequest(request, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
						      WINHTTP_NO_REQUEST_DATA, 0, 0, 0) &&
		       WinHttpReceiveResponse(request, nullptr);
	DWORD status = 0;
	DWORD status_size = sizeof(status);
	if (success)
		success = WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
					      WINHTTP_HEADER_NAME_BY_INDEX, &status, &status_size,
					      WINHTTP_NO_HEADER_INDEX) &&
			  status == 200;

	body.clear();
	while (success) {
		DWORD available = 0;
		if (!WinHttpQueryDataAvailable(request, &available)) {
			success = false;
			break;
		}
		if (available == 0)
			break;
		const size_t offset = body.size();
		body.resize(offset + available);
		DWORD read = 0;
		if (!WinHttpReadData(request, body.data() + offset, available, &read)) {
			success = false;
			break;
		}
		body.resize(offset + read);
	}
	if (request)
		WinHttpCloseHandle(request);
	if (connection)
		WinHttpCloseHandle(connection);
	WinHttpCloseHandle(session);
	return success;
}
} // namespace

ServerProcess &ServerProcess::instance()
{
	static ServerProcess process;
	return process;
}

ServerProcess::~ServerProcess()
{
	stop();
}

bool ServerProcess::port_ready()
{
	static const bool winsock_ready = [] {
		WSADATA data{};
		return WSAStartup(MAKEWORD(2, 2), &data) == 0;
	}();
	if (!winsock_ready)
		return false;

	SOCKET socket_handle = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
	if (socket_handle == INVALID_SOCKET)
		return false;

	sockaddr_in address{};
	address.sin_family = AF_INET;
	address.sin_port = htons(kServerPort);
	InetPtonW(AF_INET, L"127.0.0.1", &address.sin_addr);
	const bool connected = connect(socket_handle, reinterpret_cast<sockaddr *>(&address), sizeof(address)) == 0;
	closesocket(socket_handle);
	return connected;
}

bool ServerProcess::read_dimensions(const std::string &api_path, Dimensions &dimensions)
{
	std::string body;
	return read_api(api_path, body) && read_positive_integer(body, "width", dimensions.width) &&
	       read_positive_integer(body, "height", dimensions.height);
}

bool ServerProcess::read_layouts(std::string &json)
{
	return read_api("/api/layouts", json);
}

void ServerProcess::acquire(const std::string &executable_path, bool server_only)
{
	std::lock_guard lock(process_mutex);
	++references_;
	if (references_ == 1 && !port_ready())
		start(executable_path, server_only);
}

void ServerProcess::release()
{
	std::lock_guard lock(process_mutex);
	if (references_ == 0)
		return;
	if (--references_ == 0)
		stop();
}

void ServerProcess::ensure_started(const std::string &executable_path, bool server_only)
{
	std::lock_guard lock(process_mutex);
	if (references_ > 0 && !process_handle_ && !port_ready())
		start(executable_path, server_only);
}

void ServerProcess::start(const std::string &executable_path, bool server_only)
{
	if (executable_path.empty() || !std::filesystem::exists(widen(executable_path))) {
		blog(LOG_ERROR, "Myogi Ban executable was not found: %s", executable_path.c_str());
		return;
	}

	const std::wstring executable = widen(executable_path);
	std::wstring command_line = build_server_command_line(executable, server_only);
	std::vector<wchar_t> mutable_command(command_line.begin(), command_line.end());
	mutable_command.push_back(L'\0');

	STARTUPINFOW startup{};
	startup.cb = sizeof(startup);
	PROCESS_INFORMATION process{};
	if (!CreateProcessW(executable.c_str(), mutable_command.data(), nullptr, nullptr, FALSE,
				    CREATE_NO_WINDOW, nullptr, nullptr, &startup, &process)) {
		blog(LOG_ERROR, "Could not start Myogi Ban (Windows error %lu)", GetLastError());
		return;
	}

	HANDLE job = CreateJobObjectW(nullptr, nullptr);
	if (job) {
		JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits{};
		limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
		const bool configured = SetInformationJobObject(
			job, JobObjectExtendedLimitInformation, &limits, sizeof(limits));
		if (!configured || !AssignProcessToJobObject(job, process.hProcess)) {
			CloseHandle(job);
			job = nullptr;
		}
	}

	CloseHandle(process.hThread);
	process_handle_ = process.hProcess;
	job_handle_ = job;
	blog(LOG_INFO, "Started Myogi Ban");
}

void ServerProcess::stop()
{
	if (job_handle_) {
		CloseHandle(static_cast<HANDLE>(job_handle_));
		job_handle_ = nullptr;
	} else if (process_handle_) {
		TerminateProcess(static_cast<HANDLE>(process_handle_), 0);
	}
	if (process_handle_) {
		CloseHandle(static_cast<HANDLE>(process_handle_));
		process_handle_ = nullptr;
	}
}

std::string ServerProcess::default_executable_path() const
{
	PWSTR local_app_data = nullptr;
	if (FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local_app_data)))
		return {};

	const std::filesystem::path root(local_app_data);
	CoTaskMemFree(local_app_data);
	const std::filesystem::path candidates[] = {
		root / L"Programs" / L"myogi-ban" / L"Myogi Ban" / L"Myogi Ban.exe",
		root / L"Programs" / L"myogi-ban" / L"Myogi Ban.exe",
		root / L"Programs" / L"Myogi Ban" / L"Myogi Ban.exe",
	};
	for (const auto &candidate : candidates) {
		if (std::filesystem::exists(candidate))
			return narrow(candidate.wstring());
	}
	return {};
}
