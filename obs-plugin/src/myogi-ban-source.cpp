#include "server-process-windows.hpp"
#include "source-state.hpp"

#include <obs-module.h>

#include <string>

namespace {
constexpr const char *kExecutablePath = "executable_path";
constexpr const char *kWidth = "width";
constexpr const char *kHeight = "height";
constexpr const char *kShowDefaultLayout = "show_default_layout";
struct MyogiBanSource {
	obs_source_t *source = nullptr;
	obs_source_t *browser = nullptr;
	std::string executable_path;
	SourceState state;
};

void update_browser(MyogiBanSource *context)
{
	if (!context->browser)
		return;
	const BrowserSettings browser = context->state.browser_settings();
	obs_data_t *settings = obs_source_get_settings(context->browser);
	obs_data_set_string(settings, "url", browser.url.data());
	obs_data_set_int(settings, "width", browser.width);
	obs_data_set_int(settings, "height", browser.height);
	obs_data_set_bool(settings, "shutdown", browser.shutdown);
	obs_source_update(context->browser, settings);
	obs_data_release(settings);
}

void create_browser(MyogiBanSource *context)
{
	const BrowserSettings browser = context->state.browser_settings();
	obs_data_t *settings = obs_data_create();
	obs_data_set_string(settings, "url", browser.url.data());
	obs_data_set_int(settings, "width", browser.width);
	obs_data_set_int(settings, "height", browser.height);
	obs_data_set_bool(settings, "shutdown", browser.shutdown);
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

#if LIBOBS_API_VER >= MAKE_SEMANTIC_VERSION(32, 2, 0)
const char *source_dark_icon(void *)
{
	return obs_module_file("icons/myogi-ban-dark.svg");
}

const char *source_light_icon(void *)
{
	return obs_module_file("icons/myogi-ban-light.svg");
}
#endif

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
	context->state.apply_dimensions({static_cast<uint32_t>(obs_data_get_int(settings, kWidth)),
					 static_cast<uint32_t>(obs_data_get_int(settings, kHeight))});
	update_browser(context);
	ServerProcess::instance().ensure_started(context->executable_path);
}

void apply_dimensions(MyogiBanSource *context, const ServerProcess::Dimensions &dimensions)
{
	context->state.apply_dimensions({dimensions.width, dimensions.height});
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
	if (!context->state.advance_readiness_check(seconds))
		return;
	ServerProcess::instance().ensure_started(context->executable_path);
	if (ServerProcess::instance().port_ready()) {
		ServerProcess::Dimensions dimensions{};
		if (ServerProcess::instance().read_dimensions(dimensions)) {
			apply_dimensions(context, dimensions);
			blog(LOG_INFO, "Myogi Ban source dimensions: %ux%u", context->state.width, context->state.height);
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
	return static_cast<MyogiBanSource *>(data)->state.width;
}

uint32_t source_height(void *data)
{
	return static_cast<MyogiBanSource *>(data)->state.height;
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
#if LIBOBS_API_VER >= MAKE_SEMANTIC_VERSION(32, 2, 0)
	.icon_type = OBS_ICON_TYPE_CUSTOM,
	.get_dark_icon = source_dark_icon,
	.get_light_icon = source_light_icon,
#endif
};
