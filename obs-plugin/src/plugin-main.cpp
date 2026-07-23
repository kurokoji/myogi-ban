#include <obs-module.h>

OBS_DECLARE_MODULE()
OBS_MODULE_USE_DEFAULT_LOCALE("myogi-ban-obs", "en-US")

extern obs_source_info myogi_ban_source_info;

bool obs_module_load(void)
{
	obs_register_source(&myogi_ban_source_info);
	blog(LOG_INFO, "Myogi Ban source loaded");
	return true;
}

const char *obs_module_description(void)
{
	return "Starts Myogi Ban and renders its OBS viewer.";
}
