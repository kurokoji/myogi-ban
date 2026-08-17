#pragma once

#include <cstdint>
#include <string>

struct SourceDimensions {
	uint32_t width;
	uint32_t height;
};

struct BrowserSettings {
	std::string url;
	uint32_t width;
	uint32_t height;
	bool shutdown;
};

struct SelectedLayout {
	// The layout id, which survives renaming the layout.
	std::string id;
	bool builtin = false;
	bool is_default = true;
};

class SourceState {
public:
	uint32_t width = 500;
	uint32_t height = 250;

	void apply_dimensions(SourceDimensions dimensions);
	bool select_layout(std::string selection);
	const SelectedLayout &selected_layout() const;
	std::string dimensions_api_path() const;
	bool advance_readiness_check(float seconds);
	BrowserSettings browser_settings() const;

private:
	float readiness_check_elapsed = 0.0f;
	SelectedLayout layout;
};
