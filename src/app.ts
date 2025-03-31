import PrsmClient from "./subServices/prismaClient";
import HttpClient from "./subServices/httpClient";

export default class App {
    protected prismaClient: PrsmClient | null = null;
    protected httpClient: HttpClient | null = null;
    constructor() {
        this.prismaClient = new PrsmClient();
        if (this.prismaClient) {
            this.httpClient = new HttpClient(this.prismaClient);
        }
    }
}