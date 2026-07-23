cmake_minimum_required(VERSION 3.28)

project(myogi-ban-obs VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(libobs REQUIRED PATHS "${OBS_SDK_DIR}/cmake" NO_DEFAULT_PATH)

add_library(myogi-ban-obs MODULE
  src/plugin-main.cpp
  src/myogi-ban-source.cpp
  src/server-process-windows.cpp
)

target_include_directories(myogi-ban-obs PRIVATE src)
target_link_libraries(myogi-ban-obs PRIVATE OBS::libobs ws2_32 shell32 winhttp)
target_compile_definitions(myogi-ban-obs PRIVATE UNICODE _UNICODE WIN32_LEAN_AND_MEAN NOMINMAX)

set_target_properties(myogi-ban-obs PROPERTIES PREFIX "")

install(TARGETS myogi-ban-obs
  RUNTIME DESTINATION "obs-plugins/64bit"
  LIBRARY DESTINATION "obs-plugins/64bit"
)
install(DIRECTORY data/ DESTINATION "data/obs-plugins/myogi-ban-obs")
