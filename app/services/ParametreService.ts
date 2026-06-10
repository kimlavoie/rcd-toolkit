import { BaseService } from "./BaseService";
import { Parametres } from "@/app/db/db";

export class ParametreService extends BaseService<Parametres> {
    constructor() {
        super("parametres");
    }
}
