#include "source-state.hpp"

namespace {
constexpr float kReadinessCheckInterval = 0.25f;
constexpr std::string_view kViewerUrl = "http://127.0.0.1:33770/view";

std::string percent_encode(std::string_view value)
{
	constexpr char digits[] = "0123456789ABCDEF";
	std::string result;
	for (const unsigned char character : value) {
		if ((character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') ||
		    (character >= '0' && character <= '9') || character == '-' || character == '_' ||
		    character == '.' || character == '~') {
			result += static_cast<char>(character);
		} else {
			result += '%';
			result += digits[character >> 4];
			result += digits[character & 0x0f];
		}
	}
	return result;
}
} // namespace

void SourceState::apply_dimensions(SourceDimensions dimensions)
{
	width = dimensions.width;
	height = dimensions.height;
}

bool SourceState::select_layout(std::string selection)
{
	SelectedLayout next;
	if (selection.empty()) {
		next = {};
	} else {
		constexpr std::string_view built_in_prefix = "builtin:";
		constexpr std::string_view user_prefix = "user:";
		if (selection.starts_with(built_in_prefix))
			next = {selection.substr(built_in_prefix.size()), true, false};
		else if (selection.starts_with(user_prefix))
			next = {selection.substr(user_prefix.size()), false, false};
	}
	const bool changed = next.name != layout.name || next.builtin != layout.builtin ||
			     next.is_default != layout.is_default;
	layout = std::move(next);
	return changed;
}

const SelectedLayout &SourceState::selected_layout() const
{
	return layout;
}

std::string SourceState::dimensions_api_path() const
{
	if (layout.is_default)
		return "/api/default-layout/dimensions";
	return "/api/layouts/" + percent_encode(layout.name) + "/dimensions?builtin=" +
	       (layout.builtin ? "true" : "false");
}

bool SourceState::advance_readiness_check(float seconds)
{
	readiness_check_elapsed += seconds;
	if (readiness_check_elapsed < kReadinessCheckInterval)
		return false;
	readiness_check_elapsed = 0.0f;
	return true;
}

BrowserSettings SourceState::browser_settings() const
{
	std::string url(kViewerUrl);
	if (!layout.is_default)
		url += "?layout=" + percent_encode(layout.name) + "&builtin=" +
		       (layout.builtin ? "true" : "false");
	return {std::move(url), width, height, false};
}
