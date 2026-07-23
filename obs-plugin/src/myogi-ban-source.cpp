#include "server-process-windows.hpp"

#include <obs-module.h>

#include <string>

namespace {
constexpr const char *kExecutablePath = "executable_path";
constexpr const char *kWidth = "width";
constexpr const char *kHeight = "height";
constexpr const char *kShowDefaultLayout = "show_default_layout";
constexpr const char *kViewerUrl = "http://127.0.0.1:33770/view";

struct MyogiBanSource {
	obs_source_t *source = nullptr;
	obs_source_t *browser = nullptr;
	std::string executable_path;
	uint32_t width = 500;
	uint32_t height = 250;
	float readiness_check_elapsed = 0.0f;
};

void update_browser(MyogiBanSource *context)
{
	if (!context->browser)
		return;
	obs_data_t *settings = obs_source_get_settings(context->browser);
	obs_data_set_string(settings, "url", kViewerUrl);
	obs_data_set_int(settings, "width", context->width);
	obs_data_set_int(settings, "height", context->height);
	obs_data_set_bool(settings, "shutdown", false);
	obs_source_update(context->browser, settings);
	obs_data_release(settings);
}

void create_browser(MyogiBanSource *context)
{
	obs_data_t *settings = obs_data_create();
	obs_data_set_string(settings, "url", kViewerUrl);
	obs_data_set_int(settings, "width", context->width);
	obs_data_set_int(settings, "height", context->height);
	obs_data_set_bool(settings, "shutdown", false);
	context->browser = obs_source_create_private("browser_source", "Myogi Ban Viewer", settings);
	obs_data_release(settings);
	if (!context->browser) {
		blog(LOG_ERROR, "Could not create the OBS Browser Source for Myogi Ban");
		return;
	}
	if (!obs_source_add_active_child(context->source, context->browser)) {
		blog(LOG_ERROR, "Could not activate the OBS Browser Source for Myogi Ban");
		obs_source_release(context->browser);
		context->browser = nullptr;
	}
}

void destroy_browser(MyogiBanSource *context)
{
	if (!context->browser)
		return;
	obs_source_remove_active_child(context->source, context->browser);
	obs_source_release(context->browser);
	context->browser = nullptr;
}

void recreate_browser(MyogiBanSource *context)
{
	destroy_browser(context);
	create_browser(context);
}

const char *source_name(void *)
{
	return obs_module_text("MyogiBanSource");
}

void source_defaults(obs_data_t *settings)
{
	const std::string executable = ServerProcess::instance().default_executable_path();
	obs_data_set_default_string(settings, kExecutablePath, executable.c_str());
	obs_data_set_default_int(settings, kWidth, 500);
	obs_data_set_default_int(settings, kHeight, 250);
}

void source_update(void *data, obs_data_t *settings)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	context->executable_path = obs_data_get_string(settings, kExecutablePath);
	context->width = static_cast<uint32_t>(obs_data_get_int(settings, kWidth));
	context->height = static_cast<uint32_t>(obs_data_get_int(settings, kHeight));
	update_browser(context);
	ServerProcess::instance().ensure_started(context->executable_path);
}

void apply_dimensions(MyogiBanSource *context, const ServerProcess::Dimensions &dimensions)
{
	obs_data_t *settings = obs_source_get_settings(context->source);
	obs_data_set_int(settings, kWidth, dimensions.width);
	obs_data_set_int(settings, kHeight, dimensions.height);
	obs_source_update(context->source, settings);
	obs_data_release(settings);
}

void *source_create(obs_data_t *settings, obs_source_t *source)
{
	auto *context = new MyogiBanSource;
	context->source = source;
	source_update(context, settings);
	ServerProcess::instance().acquire(context->executable_path);
	return context;
}

void source_destroy(void *data)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	destroy_browser(context);
	ServerProcess::instance().release();
	delete context;
}

void source_tick(void *data, float seconds)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	if (context->browser)
		return;
	context->readiness_check_elapsed += seconds;
	if (context->readiness_check_elapsed < 0.25f)
		return;
	context->readiness_check_elapsed = 0.0f;
	ServerProcess::instance().ensure_started(context->executable_path);
	if (ServerProcess::instance().port_ready()) {
		ServerProcess::Dimensions dimensions{};
		if (ServerProcess::instance().read_dimensions(dimensions)) {
			apply_dimensions(context, dimensions);
			blog(LOG_INFO, "Myogi Ban source dimensions: %ux%u", context->width, context->height);
		}
		create_browser(context);
	}
}

void source_render(void *data, gs_effect_t *)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	if (context->browser)
		obs_source_video_render(context->browser);
}

uint32_t source_width(void *data)
{
	return static_cast<MyogiBanSource *>(data)->width;
}

uint32_t source_height(void *data)
{
	return static_cast<MyogiBanSource *>(data)->height;
}

void enumerate_active(void *data, obs_source_enum_proc_t callback, void *parameter)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	if (context->browser)
		callback(context->source, context->browser, parameter);
}

bool source_audio_render(void *, uint64_t *, obs_source_audio_mix *, uint32_t, size_t, size_t)
{
	return false;
}

bool show_default_layout(obs_properties_t *, obs_property_t *, void *data)
{
	auto *context = static_cast<MyogiBanSource *>(data);
	ServerProcess::Dimensions dimensions{};
	const bool dimensions_updated = ServerProcess::instance().read_dimensions(dimensions);
	if (dimensions_updated) {
		apply_dimensions(context, dimensions);
		blog(LOG_INFO, "Showing current Myogi Ban default layout at %ux%u", dimensions.width, dimensions.height);
	} else {
		blog(LOG_WARNING, "Could not refresh Myogi Ban source dimensions before showing the default layout");
	}
	recreate_browser(context);
	return dimensions_updated;
}

obs_properties_t *source_properties(void *)
{
	obs_properties_t *properties = obs_properties_create();
	obs_properties_add_path(properties, kExecutablePath, obs_module_text("ExecutablePath"), OBS_PATH_FILE,
				"Executable (*.exe);;All files (*.*)", nullptr);
	obs_properties_add_int(properties, kWidth, obs_module_text("Width"), 1, 8192, 1);
	obs_properties_add_int(properties, kHeight, obs_module_text("Height"), 1, 8192, 1);
	obs_properties_add_button(properties, kShowDefaultLayout, obs_module_text("ShowDefaultLayout"), show_default_layout);
	return properties;
}
} // namespace

obs_source_info myogi_ban_source_info = {
	.id = "myogi_ban_source",
	.type = OBS_SOURCE_TYPE_INPUT,
	.output_flags = OBS_SOURCE_VIDEO | OBS_SOURCE_CUSTOM_DRAW | OBS_SOURCE_COMPOSITE,
	.get_name = source_name,
	.create = source_create,
	.destroy = source_destroy,
	.get_width = source_width,
	.get_height = source_height,
	.get_defaults = source_defaults,
	.get_properties = source_properties,
	.update = source_update,
	.video_tick = source_tick,
	.video_render = source_render,
	.enum_active_sources = enumerate_active,
	.audio_render = source_audio_render,
};
