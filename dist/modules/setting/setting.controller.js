import { getSettingService, getSettingsService, updateSettingService, } from "./setting.service.js";
export async function getSettingController(req, res, next) {
    try {
        const key = req.params.key;
        const setting = await getSettingService(key);
        return res.json({ success: true, data: setting });
    }
    catch (err) {
        next(err);
    }
}
export async function getSettingsController(req, res, next) {
    try {
        const settings = await getSettingsService();
        return res.json({ success: true, data: settings });
    }
    catch (err) {
        next(err);
    }
}
export async function updateSettingController(req, res, next) {
    try {
        const key = req.params.key;
        const { value } = req.body;
        const setting = await updateSettingService(key, String(value));
        return res.json({
            success: true,
            message: "Setting berhasil diupdate",
            data: setting,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=setting.controller.js.map