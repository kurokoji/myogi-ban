cmake_minimum_required(VERSION 3.28)

if(NOT DEFINED MYOGI_BAN_VERSION)
  message(FATAL_ERROR "MYOGI_BAN_VERSION must match the application version")
endif()

project(myogi-ban-obs VERSION ${MYOGI_BAN_VERSION} LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(CTest)

if(BUILD_TESTING)
  add_executable(myogi-ban-obs-tests
    tests/source-state-test.cpp
    src/source-state.cpp
  )
  target_include_directories(myogi-ban-obs-tests PRIVATE src)
  add_test(NAME myogi-ban-obs-tests COMMAND myogi-ban-obs-tests)
endif()

find_package(libobs REQUIRED PATHS "${OBS_SDK_DIR}/cmake" NO_DEFAULT_PATH)

add_library(myogi-ban-obs MODULE
  src/plugin-main.cpp
  src/myogi-ban-source.cpp
  src/server-process-windows.cpp
  src/source-state.cpp
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
