/**
 * Structured data, rendered on the server so it is in the HTML a crawler is
 * handed rather than something it has to run JavaScript to find.
 *
 * The stringify is deliberate rather than a template: it drops every key we
 * left undefined, and it escapes anything a film synopsis might contain that
 * would otherwise close the script tag early.
 */
const JsonLd = ({ data }) => {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(data).replace(/</g, "\\u003c"),
            }}
        />
    );
}

export default JsonLd;
