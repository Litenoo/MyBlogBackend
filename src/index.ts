import App from "./app";
import srcMapSupport from 'source-map-support';

srcMapSupport.install(); // logs refers to ts files instead of js files

const app = new App(3001);