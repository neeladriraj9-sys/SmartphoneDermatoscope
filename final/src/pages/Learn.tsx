import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Seo } from "@/components/Seo";

const Learn = () => {
  const [category, setCategory] = useState<string>("All");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["education_articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_articles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  const filtered = category === "All" ? articles : articles.filter((a) => a.category === category);

  return (
    <AppLayout>
      <Seo
        title="Skin Health Guide"
        description="Learn how to check your skin, understand what moles look like, and know when to see a doctor — in plain English."
      />
      <header className="mb-6">
        <h1 className="font-display text-3xl">Understanding your skin</h1>
        <p className="text-muted-foreground mt-1">Clear, honest guides — no medical jargon.</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary-light"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="pulse-soft text-center py-12 text-muted-foreground text-sm">Loading articles…</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <Link key={a.id} to={`/learn/${a.slug}`} className="card-soft card-soft-hover block">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{a.category}</span>
              <h2 className="font-display text-lg mt-1.5">{a.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.summary}</p>
              <p className="text-xs text-muted-foreground mt-3">{a.read_time_minutes} min read · Read more →</p>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Learn;
