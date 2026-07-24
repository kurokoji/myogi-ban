#pragma once

#include <string>

std::wstring build_server_command_line(const std::wstring &executable, bool server_only);
unsigned long server_creation_flags();
