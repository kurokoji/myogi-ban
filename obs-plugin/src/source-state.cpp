#include "source-state.hpp"

namespace {
constexpr float kReadinessCheckInterval = 0.25f;
constexpr std::string_view kViewerUrl = "http://127.0.0.1:33770/view";
} // namespace

void SourceState::apply_dimensions(SourceDimensions dimensions)
{
	width = dimensions.width;
	height = dimensions.height;
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
	return {kViewerUrl, width, height, false};
}
