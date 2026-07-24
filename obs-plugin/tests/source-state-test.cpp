#include "source-state.hpp"

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
}
