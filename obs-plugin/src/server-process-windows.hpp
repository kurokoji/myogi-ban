#pragma once

#include <string>

class ServerProcess {
public:
	struct Dimensions {
		unsigned int width;
		unsigned int height;
	};

	static ServerProcess &instance();

	void acquire(const std::string &executable_path, bool server_only);
	void ensure_started(const std::string &executable_path, bool server_only);
	void release();
	bool port_ready();
	bool read_dimensions(const std::string &api_path, Dimensions &dimensions);
	bool read_layouts(std::string &json);
	std::string default_executable_path() const;

private:
	ServerProcess() = default;
	~ServerProcess();
	ServerProcess(const ServerProcess &) = delete;
	ServerProcess &operator=(const ServerProcess &) = delete;

	void start(const std::string &executable_path, bool server_only);
	void stop();

	void *process_handle_ = nullptr;
	void *job_handle_ = nullptr;
	unsigned int references_ = 0;
};
