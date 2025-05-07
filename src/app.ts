import DatabaseService from "./subServices/databaseService";
import HttpService from "./subServices/httpService";

export default class App {

    protected databaseService: DatabaseService | null = null;
    protected _httpService: HttpService | null = null;

    constructor(httpPort: number) {
        this.databaseService = new DatabaseService();

        if (this.databaseService) {
            this._httpService = new HttpService(this.databaseService);
            this._httpService.listen(httpPort);
        }
    }

    public get httpService() {
        return this._httpService;
    }
}