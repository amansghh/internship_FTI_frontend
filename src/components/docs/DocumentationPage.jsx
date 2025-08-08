import React from "react";
import "../../assets/css/DocumentPage.css";

const MDBOOK_URL =
    import.meta.env.VITE_DOCS_MDBOOK_URL ||
    "https://github.com/Flanders-Technology-Innovation/internship-MCP-docs/tree/documentation";

const PDF_URL = import.meta.env.VITE_DOCS_PDF_URL || "/docs/fti-mcp-docs.pdf";

export default function DocumentationPage() {
    return (
        <div className="docs-container">
            <div className="docs-header">
                <div className="docs-titles">
                    <h1 className="docs-title">FTI MCP Documentation</h1>
                    <p className="docs-subtitle">
                        Browse the docs as an mdBook or view the full PDF in‑app.
                    </p>
                </div>

                <div className="docs-actions">
                    <a
                        className="docs-btn primary"
                        href={MDBOOK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open mdBook in a new tab"
                    >
                        📖 Open mdBook
                    </a>
                    <a className="docs-btn" href={PDF_URL} download title="Download the PDF">
                        ⬇️ Download PDF
                    </a>
                </div>
            </div>

            <div className="docs-viewer">
                <iframe className="docs-iframe" title="FTI MCP PDF" src={PDF_URL}/>
                <div className="docs-fallback">
                    <p>
                        If the PDF does not render,&nbsp;
                        <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
                            open it in a new tab
                        </a>
                        &nbsp;or use the Download button above.
                    </p>
                </div>
            </div>
        </div>
    );
}
