#include "server-launch-options.hpp"

std::wstring build_server_command_line(const std::wstring &executable, bool server_only)
{
	std::wstring command_line = L"\"" + executable + L"\"";
	if (server_only)
		command_line += L" --server-only";
	return command_line;
}
