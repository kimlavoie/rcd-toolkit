import { BaseService } from "./BaseService";
import { Preference } from "@/app/db/db";

export class PreferenceService extends BaseService<Preference> {
    constructor() {
        super("preferences");
    }
}
