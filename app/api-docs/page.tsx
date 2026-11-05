import { getApiDocs } from "../../lib/swagger";
import ReactSwagger from "./react-swagger";

export default function ApiDocsPage() {
    const spec = getApiDocs();

    return <ReactSwagger spec={spec} />;
}