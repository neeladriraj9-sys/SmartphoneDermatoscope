import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const Article = () => {
  const { slug } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_articles")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <AppLayout><div className="pulse-soft text-center py-12 text-muted-foreground">Loading…</div></AppLayout>;
  }

  if (!article) {
    return (
      <AppLayout>
        <Seo title="Article not found" noindex />
        <div className="card-soft text-center py-12">
          <h1 className="font-display text-2xl mb-2">Article not found</h1>
          <Link to="/learn" className="text-primary-dark hover:underline">Back to all articles</Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Seo title={article.title} description={article.summary} />
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-primary-dark hover:underline mb-4">
        <ArrowLeft size={14} /> Back to all articles
      </Link>
      <article className="card-soft">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{article.category}</span>
        <h1 className="font-display text-3xl mt-2">{article.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{article.read_time_minutes} min read</p>
        <div className="prose prose-sm mt-6 max-w-none" style={{ fontSize: "15px", lineHeight: 1.8 }}>
          {article.body.split("\n\n").map((para, i) => (
            <p key={i} className="mb-4 whitespace-pre-line">
              {para.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
                seg.startsWith("**") && seg.endsWith("**") ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>
              )}
            </p>
          ))}
        </div>
      </article>
    </AppLayout>
  );
};

export default Article;
