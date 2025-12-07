import { convertNumbers } from '../i18n';
import { PRE_TAG, POST_TAG } from '../services/azureSearchService';

export const SearchResults = ({ results, language, loading, error, t }) => {
  const getResultContent = (result) => {
    return {
      title: result.title || "Result",
      description: result.description || "",
      subtitle: result.subtitle || "",
      subtitle2: result.subtitle2 || "",
    };
  };

  const renderHighlights = (highlights) => {
    const jsonStr = JSON.stringify(highlights, null, 2);
    const preTagRegex = new RegExp(PRE_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const postTagRegex = new RegExp(POST_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    
    return jsonStr
      .split(new RegExp(`(${PRE_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${POST_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g"))
      .map((part, idx) => {
        if (part.includes(PRE_TAG) && part.includes(POST_TAG)) {
          const content = part.replace(preTagRegex, "").replace(postTagRegex, "");
          return <span key={idx} style={{ backgroundColor: "#FFFF00", fontWeight: "bold" }}>{content}</span>;
        }
        return <span key={idx}>{part}</span>;
      });
  };

  const groupResults = (results) => {
    const grouped = {};
    results.forEach((result) => {
      const title = result.title || "Unknown";
      if (!grouped[title]) {
        grouped[title] = [];
      }
      grouped[title].push(result);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="loading">
        <p>{t.searchingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>{t.noResults}</p>
      </div>
    );
  }

  const grouped = groupResults(results);

  return (
    <>
      <div className="results-list">
        <div className="result-count">
          {t.foundResults(convertNumbers(results.length, language))}
        </div>
        {Object.entries(grouped).map(([title, items], groupIndex) => (
          <details key={groupIndex} style={{ marginBottom: "24px", border: "2px solid #FFD700", borderRadius: "12px", padding: "0" }}>
            <summary style={{ fontSize: "16px", fontWeight: "700", color: "#000", paddingBottom: "8px", padding: "12px", cursor: "pointer", borderBottom: "2px solid #FFD700", backgroundColor: "#fffef5" }}>
              {title} <span style={{ fontSize: "14px", color: "#666", fontWeight: "400" }}>({convertNumbers(items.length, language)})</span>
            </summary>
            <div style={{ padding: "12px" }}>
              {items.map((result, itemIndex) => {
                const content = getResultContent(result);
                return (
                  <div key={itemIndex} className="result-item" style={{ marginBottom: "12px" }}>
                    {content.subtitle && (
                      <h4 style={{ margin: "0 0 12px 0", color: "#000", fontSize: "18px", fontWeight: "600", borderBottom: "2px solid #FFD700", paddingBottom: "8px" }}>
                        {content.subtitle}
                      </h4>
                    )}
                    {content.subtitle2 && (
                      <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                        {content.subtitle2}
                      </p>
                    )}
                    <p>{content.description}</p>
                    
                    {/* Search Hit Details */}
                    <details style={{ marginTop: "12px", fontSize: "11px", color: "#999", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                      <summary style={{ cursor: "pointer", fontWeight: "600", color: "#666" }}>
                        {t.searchHit}
                      </summary>
                      <pre style={{ backgroundColor: "#f5f5f5", padding: "8px", borderRadius: "4px", overflow: "auto", maxHeight: "200px", fontSize: "10px", whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                        {renderHighlights(result.highlights)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </>
  );
};