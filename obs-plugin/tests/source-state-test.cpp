#include "source-state.hpp"
#include "server-launch-options.hpp"

#include <cstdlib>
#include <iostream>
#include <string_view>

namespace {
void expect(bool condition, std::string_view message)
{
	if (condition)
		return;
	std::cerr << "FAILED: " << message << '\n';
	std::exit(1);
}
} // namespace

int main()
{
	expect(build_server_command_line(L"C:\\Myogi Ban\\Myogi Ban.exe", true) ==
		       L"\"C:\\Myogi Ban\\Myogi Ban.exe\" --server-only",
	       "adds server-only to the launch command by default");
	expect(build_server_command_line(L"C:\\Myogi Ban\\Myogi Ban.exe", false) ==
		       L"\"C:\\Myogi Ban\\Myogi Ban.exe\"",
	       "can launch Myogi Ban with its regular window");

	SourceState state;
	expect(state.width == 500 && state.height == 250, "uses the default source dimensions");

	state.apply_dimensions({1280, 720});
	expect(state.width == 1280 && state.height == 720, "applies dimensions returned by the server");

	expect(!state.advance_readiness_check(0.1f), "does not poll before 0.25 seconds");
	expect(!state.advance_readiness_check(0.14f), "accumulates readiness time");
	expect(state.advance_readiness_check(0.01f), "polls when 0.25 seconds is reached");
	expect(!state.advance_readiness_check(0.24f), "resets readiness time after polling");

	const BrowserSettings browser = state.browser_settings();
	expect(browser.url == "http://127.0.0.1:33770/view", "uses the Myogi Ban viewer URL");
	expect(browser.width == 1280 && browser.height == 720, "uses current dimensions for the browser");
	expect(!browser.shutdown, "keeps the private browser active");

	expect(state.select_layout("builtin:arcade stick"), "reports a changed layout selection");
	const BrowserSettings built_in = state.browser_settings();
	expect(built_in.url == "http://127.0.0.1:33770/view?layout=arcade%20stick&builtin=true",
	       "uses the selected built-in layout in the viewer URL");
	expect(state.selected_layout().name == "arcade stick" && state.selected_layout().builtin,
	       "exposes the selected built-in layout");
	expect(state.dimensions_api_path() == "/api/layouts/arcade%20stick/dimensions?builtin=true",
	       "uses the selected layout dimensions endpoint");

	expect(!state.select_layout("builtin:arcade stick"), "does not report an unchanged layout selection");
	state.select_layout("user:\xE6\x97\xA5\xE6\x9C\xAC\xE8\xAA\x9E");
	const BrowserSettings user = state.browser_settings();
	expect(user.url ==
		       "http://127.0.0.1:33770/view?layout=%E6%97%A5%E6%9C%AC%E8%AA%9E&builtin=false",
	       "percent-encodes the selected user layout in the viewer URL");
	expect(!state.selected_layout().builtin, "exposes the selected user layout");

	state.select_layout("");
	expect(state.selected_layout().is_default, "an empty selection means the current default layout");
	expect(state.dimensions_api_path() == "/api/default-layout/dimensions",
	       "uses the default layout dimensions endpoint when no layout is selected");
	expect(state.browser_settings().url == "http://127.0.0.1:33770/view",
	       "restores the default viewer URL");
}
