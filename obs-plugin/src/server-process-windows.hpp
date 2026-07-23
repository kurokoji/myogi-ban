#pragma once

#include <string>

class ServerProcess {
public:
	struct Dimensions {
		unsigned int width;
		unsigned int height;
	};

	static ServerProcess &instance();

	void acquire(const std::string &executable_path);
	void ensure_started(const std::string &executable_path);
	void release();
	bool port_ready();
	bool read_dimensions(Dimensions &dimensions);
	std::string default_executable_path() const;

private:
	ServerProcess() = default;
	~ServerProcess();
	ServerProcess(const ServerProcess &) = delete;
	ServerProcess &operator=(const ServerProcess &) = delete;

	void start(const std::string &executable_path);
	void stop();

	void *process_handle_ = nullptr;
	void *job_handle_ = nullptr;
	unsigned int references_ = 0;
};
