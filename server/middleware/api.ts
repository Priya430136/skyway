import { fromNodeMiddleware } from "h3";
import { getExpressApiApp } from "../../src/server/apiApp";

export default fromNodeMiddleware(getExpressApiApp());
