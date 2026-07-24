#pragma once

#include <cstdint>
#include <string_view>

struct SourceDimensions {
	uint32_t width;
	uint32_t height;
};

struct BrowserSettings {
	std::string_view url;
	uint32_t width;
	uint32_t height;
	bool shutdown;
};

class SourceState {
public:
	uint32_t width = 500;
	uint32_t height = 250;

	void apply_dimensions(SourceDimensions dimensions);
	bool advance_readiness_check(float seconds);
	BrowserSettings browser_settings() const;

private:
	float readiness_check_elapsed = 0.0f;
};
