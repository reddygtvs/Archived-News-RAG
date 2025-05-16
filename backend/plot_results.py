import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
import math 
import logging

# --- Configuration ---
RESULTS_FILE = "data/evaluation_results_v2.jsonl" # Read from the results file
OUTPUT_DIR = "data/plots_final_automated" # Graph directory
PLOT_STYLE = "seaborn-v0_8-talk" 
DPI_SETTING = 150 

# --- Ensure Output Directory Exists ---
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Load and Preprocess Data ---
logger = logging.getLogger('plot_results')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

try:
    results_list = []
    with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                results_list.append(json.loads(line))
            except json.JSONDecodeError as e:
                 logger.warning(f"Skipping line due to JSON decode error: {e} - Line: {line[:100]}...")
    df = pd.DataFrame(results_list)

    # --- Data Cleaning and Metric Extraction ---
    numeric_cols = [
        'standard_response_wc', 'rag_response_wc', 'rag_citation_count',
        'rag_retrieved_articles_count', 'standard_llm_duration',
        'rag_retrieval_duration', 'rag_llm_duration', 'rag_total_duration',
        'rag_context_length_chars', 'llm_evaluation_duration'
    ]
    for col in numeric_cols:
        if col in df.columns: df[col] = pd.to_numeric(df[col], errors='coerce')

    llm_eval_available = 'llm_evaluation' in df.columns and df['llm_evaluation'].notna().any()
    if llm_eval_available:
        logger.info("Extracting LLM evaluation scores...")
        try:
           
            std_score_keys = ["relevance", "factual_accuracy_2015", "specificity_2015",
                              "temporal_accuracy", "completeness", "coherence", "lack_of_hallucination_2015"]
            rag_score_keys = std_score_keys + ["groundedness_to_source"] 

            def safe_get_score(eval_dict, response_type, key):
                try: return float(eval_dict[f'{response_type}_scores'][key])
                except (TypeError, KeyError, ValueError): return np.nan

            for key in std_score_keys:
                df[f'std_score_{key}'] = df['llm_evaluation'].apply(lambda x: safe_get_score(x, 'standard', key))
            for key in rag_score_keys:
                df[f'rag_score_{key}'] = df['llm_evaluation'].apply(lambda x: safe_get_score(x, 'rag', key))

            df['llm_eval_summary'] = df['llm_evaluation'].apply(
                lambda x: x.get('comparative_summary', '') if isinstance(x, dict) else ''
            )
            logger.info("LLM evaluation scores extracted.")
        except Exception as e:
            logger.error(f"Error extracting LLM evaluation scores: {e}. LLM plots may fail.", exc_info=True)
            llm_eval_available = False # Mark as unavailable if extraction fails
    else:
        logger.warning("LLM evaluation data not found or all NaN in results file. LLM Eval plots will be skipped.")


    # Calculate average min distance
    if 'rag_min_distances' in df.columns:
         df['avg_min_distance'] = df['rag_min_distances'].apply(
             lambda x: np.mean([d for d in x if isinstance(d, (int, float))]) if isinstance(x, list) and len(x) > 0 else np.nan
         )
    else: df['avg_min_distance'] = np.nan

    # Calculate RAG advantage scores (RAG - Standard)
    if llm_eval_available:
        for key in std_score_keys: 
             if f'std_score_{key}' in df.columns and f'rag_score_{key}' in df.columns:
                 df[f'score_diff_{key}'] = df[f'rag_score_{key}'] - df[f'std_score_{key}']

    logger.info(f"Loaded and preprocessed {len(df)} results from {RESULTS_FILE}")
    logger.info(f"Available columns for plotting: {df.columns.tolist()}")

except FileNotFoundError:
    logger.error(f"Error: Results file not found at {RESULTS_FILE}. Run evaluate.py first.")
    exit()
except Exception as e:
    logger.error(f"Error loading or preprocessing results data: {e}", exc_info=True)
    exit()


plt.style.use(PLOT_STYLE)
cmap_seq = sns.color_palette("viridis", as_cmap=True)
cmap_div = sns.color_palette("coolwarm", as_cmap=True)
# --- END Load and Preprocess Data ---


# --- Plotting Functions ---

# == Category 1: Retrieval Performance ==
def plot_01_avg_distance_per_query(df, output_dir):
    if 'avg_min_distance' not in df.columns: return logger.warning("Skipping plot 01: Missing 'avg_min_distance'")
    plot_df = df.dropna(subset=['avg_min_distance', 'query_id'])
    if plot_df.empty: return logger.warning("Skipping plot 01: No data after dropna")
    plt.figure(figsize=(16, 8)) # made it wider for more query labels
    sns.barplot(x='query_id', y='avg_min_distance', data=plot_df, palette='coolwarm_r')
    plt.title('1: Average Retrieval Distance per Query (Lower is Better)')
    plt.xlabel('Query ID')
    plt.ylabel('Average Min Distance (L2 Norm)')
    plt.xticks(rotation=70, ha='right', fontsize=10) 
    plt.ylim(bottom=0) 
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "01_avg_distance_per_query.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 01_avg_distance_per_query.png")

def plot_02_retrieval_time_dist(df, output_dir):
    if 'rag_retrieval_duration' not in df.columns: return logger.warning("Skipping plot 02: Missing 'rag_retrieval_duration'")
    plot_df = df.dropna(subset=['rag_retrieval_duration'])
    if plot_df.empty: return logger.warning("Skipping plot 02: No data after dropna")
    # To check for significant outliers that might skew the plot
    q_high = plot_df['rag_retrieval_duration'].quantile(0.99)
    plot_df_filtered = plot_df[plot_df['rag_retrieval_duration'] < q_high * 1.5] 
    if plot_df_filtered.empty: plot_df_filtered = plot_df 

    plt.figure(figsize=(10, 6))
    sns.histplot(plot_df_filtered['rag_retrieval_duration'], bins=15, kde=True, color='darkcyan')
    median_time = plot_df_filtered['rag_retrieval_duration'].median()
    plt.axvline(median_time, color='red', linestyle='--', label=f'Median: {median_time:.2f}s')
    plt.title('2: Distribution of Retrieval Phase Duration')
    plt.xlabel('Retrieval Duration (Seconds)')
    plt.ylabel('Frequency Count')
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "02_retrieval_time_hist.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 02_retrieval_time_hist.png")


# == Category 2: RAG Response Characteristics ==
def plot_03_citation_counts(df, output_dir):
    if 'rag_citation_count' not in df.columns: return logger.warning("Skipping plot 03: Missing 'rag_citation_count'")
    plot_df = df.dropna(subset=['rag_citation_count', 'query_id'])
    if plot_df.empty: return logger.warning("Skipping plot 03: No data after dropna")
    plt.figure(figsize=(16, 8))
    sns.barplot(x='query_id', y='rag_citation_count', data=plot_df, palette='viridis') 
    plt.title('3: Number of Source Citations Found in RAG Responses')
    plt.xlabel('Query ID')
    plt.ylabel('Number of Citations (URL:...)')
    plt.xticks(rotation=70, ha='right', fontsize=10)
    max_citations = plot_df['rag_citation_count'].max()
    if pd.notna(max_citations) and max_citations >= 0:
         plt.yticks(np.arange(0, math.ceil(max_citations / 2.0) * 2 + 2, step=2)) # Ticks every 2
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "03_citation_counts_bar.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 03_citation_counts_bar.png")


# == Category 3: Comparison: Standard vs. RAG ==
def plot_04_response_length_comparison(df, output_dir):
    cols_needed = ['query_id', 'standard_response_wc', 'rag_response_wc']
    if not all(col in df.columns for col in cols_needed): return logger.warning("Skipping plot 04: Missing word count columns")
    plot_df = df[cols_needed].dropna()
    if plot_df.empty: return logger.warning("Skipping plot 04: No data after dropna")

    df_melted = plot_df.melt(id_vars='query_id', var_name='Response Type', value_name='Word Count')
    df_melted['Response Type'] = df_melted['Response Type'].map({'standard_response_wc': 'Standard', 'rag_response_wc': 'RAG'})

    plt.figure(figsize=(16, 8))
    sns.barplot(x='query_id', y='Word Count', hue='Response Type', data=df_melted, palette='Paired') 
    plt.title('4: Response Length Comparison (Standard vs. RAG)')
    plt.xlabel('Query ID')
    plt.ylabel('Word Count')
    plt.xticks(rotation=70, ha='right', fontsize=10)
    plt.legend(title='Response Type', loc='upper right')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "04_response_length_comparison_bar.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 04_response_length_comparison_bar.png")

def plot_05_total_time_comparison(df, output_dir):
    cols_needed = ['query_id', 'standard_llm_duration', 'rag_total_duration']
    if not all(col in df.columns for col in cols_needed): return logger.warning("Skipping plot 05: Missing duration columns")
    df_renamed = df.rename(columns={'standard_llm_duration': 'standard_total_duration'})
    plot_df = df_renamed[['query_id', 'standard_total_duration', 'rag_total_duration']].dropna()
    if plot_df.empty: return logger.warning("Skipping plot 05: No data after dropna")

    df_melted = plot_df.melt(id_vars='query_id', var_name='Processing Type', value_name='Duration (s)')
    df_melted['Processing Type'] = df_melted['Processing Type'].map({'standard_total_duration': 'Standard (Total)', 'rag_total_duration': 'RAG (Total)'})

    plt.figure(figsize=(16, 8))
    sns.barplot(x='query_id', y='Duration (s)', hue='Processing Type', data=df_melted, palette=['mediumpurple', 'lightgreen'])
    plt.title('5: Total Response Time Comparison (Standard vs. RAG)')
    plt.xlabel('Query ID')
    plt.ylabel('Total Duration (Seconds)')
    plt.xticks(rotation=70, ha='right', fontsize=10)
    plt.legend(title='Processing Type', loc='upper right')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "05_total_time_comparison_bar.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 05_total_time_comparison_bar.png")

def plot_06_time_components_rag(df, output_dir):
    cols_needed = ['query_id', 'rag_retrieval_duration', 'rag_llm_duration']
    if not all(col in df.columns for col in cols_needed): return logger.warning("Skipping plot 06: Missing RAG duration components")
    # --- CORRECTED LINE ---
    plot_df = df[cols_needed].dropna() # To select only the needed columns ONCE
    # --- END CORRECTION ---
    if plot_df.empty: return logger.warning("Skipping plot 06: No data after dropna")

    # Melted the dataframe for easier plotting with seaborn
    df_melted = plot_df.melt(id_vars='query_id', value_vars=['rag_retrieval_duration', 'rag_llm_duration'],
                             var_name='Component', value_name='Duration (s)')
    df_melted['Component'] = df_melted['Component'].map({'rag_retrieval_duration': 'Retrieval', 'rag_llm_duration': 'LLM Generation'})

    plt.figure(figsize=(16, 8))

    sns.barplot(x='query_id', y='Duration (s)', hue='Component', data=df_melted, palette=['salmon', 'lightblue']) 

    plt.title('6: RAG Processing Time Breakdown (Retrieval vs. LLM Generation)')
    plt.xlabel('Query ID')
    plt.ylabel('Duration (Seconds)')
    plt.xticks(rotation=70, ha='right', fontsize=10)
    plt.legend(title='RAG Component')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "06_rag_time_breakdown_grouped.png"), dpi=DPI_SETTING) 
    plt.close()
    logger.info("Generated: 06_rag_time_breakdown_grouped.png")


# == Category 4: LLM Evaluation Results (Requires successful run of evaluator) ==
def plot_07_llm_eval_radar(df, output_dir):
    if not llm_eval_available: return logger.warning("Skipping plot 07: LLM Eval data unavailable")

    criteria = ["relevance", "factual_accuracy_2015", "specificity_2015",
                "temporal_accuracy", "completeness", "coherence", "lack_of_hallucination_2015"]
    std_cols = [f'std_score_{c}' for c in criteria]
    rag_cols = [f'rag_score_{c}' for c in criteria]


    if not all(col in df.columns for col in std_cols + rag_cols):
         return logger.warning("Skipping plot 07: Missing some LLM score columns.")

    avg_std_scores = [df[col].mean(skipna=True) for col in std_cols]
    avg_rag_scores = [df[col].mean(skipna=True) for col in rag_cols]

    if any(pd.isna(s) for s in avg_std_scores) or any(pd.isna(s) for s in avg_rag_scores):
         return logger.warning("Skipping plot 07: Could not calculate valid average scores (NaNs present).")


    labels = [c.replace('_2015', '').replace('_', ' ').title() for c in criteria]
    num_vars = len(labels)

    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    angles += angles[:1] 

    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))

    def add_to_radar(values, color, label):
        values += values[:1] 
        ax.plot(angles, values, color=color, linewidth=2, linestyle='solid', label=label)
        ax.fill(angles, values, color=color, alpha=0.25)

    add_to_radar(avg_std_scores, 'salmon', 'Standard LLM')
    add_to_radar(avg_rag_scores, 'skyblue', 'RAG LLM')
    # Best attempt to prettify plot
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    plt.xticks(angles[:-1], labels, size=12)
    ax.set_yticks(np.arange(1, 6, 1)) 
    ax.set_yticklabels([str(i) for i in range(1, 6)])
    plt.ylim(0, 5.5) 
    ax.set_rlabel_position(180 / num_vars) 
    plt.title('7: Average LLM Evaluation Scores (Gemini 1.5 Pro)', size=16, y=1.1)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "07_llm_eval_radar.png"), dpi=DPI_SETTING, bbox_inches='tight')
    plt.close()
    logger.info("Generated: 07_llm_eval_radar.png")

def plot_08_llm_eval_bars(df, output_dir):
    if not llm_eval_available: return logger.warning("Skipping plot 08: LLM Eval data unavailable")
    criteria = ["relevance", "factual_accuracy_2015", "specificity_2015", "temporal_accuracy",
                "completeness", "coherence", "lack_of_hallucination_2015", "groundedness_to_source"] 
    score_columns = []
    plot_data = []

    for query_id in df['query_id'].unique():
        row = df[df['query_id'] == query_id].iloc[0]
        for criterion in criteria:
            std_col = f'std_score_{criterion}'
            rag_col = f'rag_score_{criterion}'
            criterion_label = criterion.replace('_2015', '').replace('_', ' ').title()

            if std_col in row and pd.notna(row[std_col]):
                plot_data.append({'Query ID': query_id, 'Criterion': criterion_label, 'Score': row[std_col], 'ResponseType': 'Standard'})
            # Groundedness only applies to RAG
            if rag_col in row and pd.notna(row[rag_col]):
                 plot_data.append({'Query ID': query_id, 'Criterion': criterion_label, 'Score': row[rag_col], 'ResponseType': 'RAG'})

    if not plot_data:
        return logger.warning("Skipping plot 08: No valid score data to plot.")

    plot_df_melted = pd.DataFrame(plot_data)
    # Sort criteria for consistent plotting order
    ordered_criteria = [c.replace('_2015', '').replace('_', ' ').title() for c in criteria]

    plt.figure(figsize=(16, 9))
    sns.barplot(x='Criterion', y='Score', hue='ResponseType', data=plot_df_melted, palette='Paired',
                order=ordered_criteria, errorbar='sd') # Show standard deviation
    plt.title('8: Average LLM Evaluation Scores per Criterion (Error Bars = SD)')
    plt.xlabel('Evaluation Criterion')
    plt.ylabel('Average Score (1-5)')
    plt.xticks(rotation=45, ha='right', fontsize=10)
    plt.ylim(0, 5.5)
    plt.legend(title='Response Type')
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "08_llm_eval_bars.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 08_llm_eval_bars.png")

def plot_09_llm_eval_diff_box(df, output_dir):
    if not llm_eval_available: return logger.warning("Skipping plot 09: LLM Eval data unavailable")
    criteria = ["relevance", "factual_accuracy_2015", "specificity_2015",
                "temporal_accuracy", "completeness", "coherence", "lack_of_hallucination_2015"]
    diff_cols = [f'score_diff_{c}' for c in criteria]

    if not all(col in df.columns for col in diff_cols):
        return logger.warning("Skipping plot 09: Missing score difference columns.")

    plot_df = df[['query_id'] + diff_cols].dropna()
    if plot_df.empty: return logger.warning("Skipping plot 09: No data after dropna")

    df_melted = plot_df.melt(id_vars='query_id', var_name='Criterion', value_name='Score Difference (RAG - Std)')
    df_melted['Criterion'] = df_melted['Criterion'].str.replace('score_diff_', '', regex=False).str.replace('_2015', '').str.replace('_', ' ').str.title()

    plt.figure(figsize=(16, 8))
    sns.boxplot(x='Criterion', y='Score Difference (RAG - Std)', data=df_melted, palette='coolwarm', showfliers=False)
    sns.stripplot(x='Criterion', y='Score Difference (RAG - Std)', data=df_melted, color=".25", alpha=0.6) 
    plt.axhline(0, color='grey', linestyle='--', linewidth=1)
    plt.title('9: Distribution of LLM Score Difference (RAG - Standard) per Criterion')
    plt.xlabel('Evaluation Criterion')
    plt.ylabel('Score Difference (Positive favors RAG)')
    plt.xticks(rotation=45, ha='right', fontsize=10)
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "09_llm_eval_diff_box.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 09_llm_eval_diff_box.png")


# == Category 5: Correlations and Relationships ==
def plot_10_correlation_heatmap(df, output_dir):
    cols_for_corr = [
        'avg_min_distance', 'rag_citation_count', 'standard_response_wc', 'rag_response_wc',
        'standard_llm_duration', 'rag_retrieval_duration', 'rag_llm_duration', 'rag_total_duration',
        'rag_context_length_chars'
    ]

    if llm_eval_available:
        llm_score_cols = [col for col in df.columns if 'std_score_' in col or 'rag_score_' in col]
        cols_for_corr.extend(llm_score_cols)

    cols_exist = [col for col in cols_for_corr if col in df.columns and df[col].notna().any()]
    if len(cols_exist) < 2 : return logger.warning("Skipping plot 10: Not enough numeric columns for correlation heatmap.")

    corr_df = df[cols_exist].corr()

    plt.figure(figsize=(18, 15)) 
    sns.heatmap(corr_df, annot=True, fmt=".2f", cmap='coolwarm', linewidths=.5,
                annot_kws={"size": 9})
    plt.title('10: Correlation Matrix of Evaluation Metrics', fontsize=16)
    plt.xticks(rotation=60, ha='right', fontsize=10)
    plt.yticks(rotation=0, fontsize=10)
    plt.tight_layout(pad=2.0) 
    plt.savefig(os.path.join(output_dir, "10_correlation_heatmap.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 10_correlation_heatmap.png")

def plot_11_retrieval_time_vs_llm_time_rag(df, output_dir):
    cols_needed = ['rag_retrieval_duration', 'rag_llm_duration']
    if not all(col in df.columns for col in cols_needed): return logger.warning("Skipping plot 11: Missing RAG duration components")
    plot_df = df[cols_needed].dropna()
    if plot_df.empty or len(plot_df) < 2: return logger.warning("Skipping plot 11: No data after dropna")

    plt.figure(figsize=(10, 7))
    sns.scatterplot(x='rag_retrieval_duration', y='rag_llm_duration', data=plot_df, s=100, alpha=0.8, hue='rag_retrieval_duration', palette='plasma', legend=False)
    plt.title('11: RAG LLM Generation Time vs. Retrieval Time')
    plt.xlabel('Retrieval Duration (Seconds)')
    plt.ylabel('LLM Generation Duration (Seconds)')
    plt.grid(True, alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "11_retrieval_vs_llm_time_scatter.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 11_retrieval_vs_llm_time_scatter.png")

def plot_12_citations_vs_specificity_score(df, output_dir):
    cols_needed = ['rag_citation_count', 'rag_score_specificity_2015']
    if not all(col in df.columns for col in cols_needed) or not llm_eval_available:
        return logger.warning("Skipping plot 12: Missing citation or specificity score columns")
    plot_df = df[cols_needed].dropna()
    if plot_df.empty or len(plot_df) < 2: return logger.warning("Skipping plot 12: No data after dropna")

    plt.figure(figsize=(10, 7))

    sns.stripplot(x='rag_score_specificity_2015', y='rag_citation_count', data=plot_df, alpha=0.7, jitter=0.15, palette='crest')
    

    plt.title('12: RAG Citation Count vs. LLM-Evaluated Specificity Score')
    plt.xlabel('Specificity Score (1-5)')
    plt.ylabel('Number of Citations Found')
    max_citations = plot_df['rag_citation_count'].max()
    if pd.notna(max_citations) and max_citations >= 0:
         plt.yticks(np.arange(0, math.ceil(max_citations / 2.0) * 2 + 2, step=2))
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "12_citations_vs_specificity_scatter.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 12_citations_vs_specificity_scatter.png")


# == Category 6: Performance ==
def plot_13_overall_eval_time_dist(df, output_dir):
    if 'query_eval_duration_total' not in df.columns: return logger.warning("Skipping plot 13: Missing 'query_eval_duration_total'")
    plot_df = df.dropna(subset=['query_eval_duration_total'])
    if plot_df.empty: return logger.warning("Skipping plot 13: No data after dropna")
    plt.figure(figsize=(10, 6))
    sns.histplot(plot_df['query_eval_duration_total'], bins=15, kde=True, color='mediumorchid')
    median_time = plot_df['query_eval_duration_total'].median()
    plt.axvline(median_time, color='black', linestyle='--', label=f'Median: {median_time:.2f}s')
    plt.title('13: Distribution of Total Evaluation Time per Query (Incl. LLM Eval)')
    plt.xlabel('Total Duration per Query (Seconds)')
    plt.ylabel('Frequency Count')
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.6)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "13_total_eval_time_hist.png"), dpi=DPI_SETTING)
    plt.close()
    logger.info("Generated: 13_total_eval_time_hist.png")


# --- Generate Tables (as text files) ---
def save_llm_eval_summary_table(df, output_dir):
    if not llm_eval_available: return logger.warning("Skipping Table 1: LLM Eval data unavailable")
    criteria = ["relevance", "factual_accuracy_2015", "specificity_2015", "temporal_accuracy",
                "completeness", "coherence", "lack_of_hallucination_2015"]
    rag_criteria = criteria + ["groundedness_to_source"] 

    avg_scores = {}
    # To calculate average scores safely
    for criterion in criteria:
        std_col = f'std_score_{criterion}'
        rag_col = f'rag_score_{criterion}'
        if std_col in df.columns: avg_scores[f'Standard_{criterion}'] = df[std_col].mean(skipna=True)
        if rag_col in df.columns: avg_scores[f'RAG_{criterion}'] = df[rag_col].mean(skipna=True)
    grounded_col = 'rag_score_groundedness_to_source'
    if grounded_col in df.columns: avg_scores['RAG_groundedness_to_source'] = df[grounded_col].mean(skipna=True)


    table_str = "Table 1: Average LLM Evaluation Scores (1-5 Scale)\n"
    table_str += "=" * 60 + "\n"
    table_str += f"{'Criterion':<30} | {'Standard Avg':<15} | {'RAG Avg':<10}\n"
    table_str += "-" * 60 + "\n"
    for criterion in criteria: 
        label = criterion.replace('_2015', '').replace('_', ' ').title()
        std_avg = avg_scores.get(f'Standard_{criterion}', np.nan)
        rag_avg = avg_scores.get(f'RAG_{criterion}', np.nan)
        table_str += f"{label:<30} | {std_avg:^15.2f} | {rag_avg:^10.2f}\n"

    grounded_label = "Groundedness (RAG Only)"
    grounded_avg = avg_scores.get('RAG_groundedness_to_source', np.nan)
    table_str += f"{grounded_label:<30} | {'N/A':^15} | {grounded_avg:^10.2f}\n"
    table_str += "=" * 60 + "\n"

    filepath = os.path.join(output_dir, "Table_1_LLM_Eval_Scores.txt")
    try:
        with open(filepath, 'w') as f:
            f.write(table_str)
        logger.info(f"Generated: {os.path.basename(filepath)}")
    except IOError as e:
        logger.error(f"Failed to write table file {filepath}: {e}")


def save_performance_summary_table(df, output_dir):
    perf_metrics = {
        "Avg. Retrieval Dist.": df['avg_min_distance'].mean(skipna=True),
        "Avg. Citations (RAG)": df['rag_citation_count'].mean(skipna=True),
        "Avg. Word Count (Std)": df['standard_response_wc'].mean(skipna=True),
        "Avg. Word Count (RAG)": df['rag_response_wc'].mean(skipna=True),
        "Avg. LLM Duration (Std) (s)": df['standard_llm_duration'].mean(skipna=True),
        "Avg. Retrieval Duration (RAG) (s)": df['rag_retrieval_duration'].mean(skipna=True),
        "Avg. LLM Duration (RAG) (s)": df['rag_llm_duration'].mean(skipna=True),
        "Avg. Total Duration (RAG) (s)": df['rag_total_duration'].mean(skipna=True),
        "Avg. LLM Eval Duration (s)": df['llm_evaluation_duration'].mean(skipna=True) if 'llm_evaluation_duration' in df.columns else np.nan
    }

    table_str = "Table 2: Performance Metrics Summary (Averages)\n"
    table_str += "=" * 60 + "\n"
    table_str += f"{'Metric':<40} | {'Average Value':<15}\n"
    table_str += "-" * 60 + "\n"
    for key, value in perf_metrics.items():
        table_str += f"{key:<40} | {value:^15.2f}\n" if pd.notna(value) else f"{key:<40} | {'N/A':^15}\n"
    table_str += "=" * 60 + "\n"

    filepath = os.path.join(output_dir, "Table_2_Performance_Summary.txt")
    try:
        with open(filepath, 'w') as f:
            f.write(table_str)
        logger.info(f"Generated: {os.path.basename(filepath)}")
    except IOError as e:
        logger.error(f"Failed to write table file {filepath}: {e}")


# --- Main Execution ---
if __name__ == "__main__":
    if 'df' in locals() and not df.empty:
        logger.info("\n--- Generating Plots & Tables ---")
        plot_01_avg_distance_per_query(df, OUTPUT_DIR)
        plot_02_retrieval_time_dist(df, OUTPUT_DIR)
        plot_03_citation_counts(df, OUTPUT_DIR)
        plot_04_response_length_comparison(df, OUTPUT_DIR)
        plot_05_total_time_comparison(df, OUTPUT_DIR)
        plot_06_time_components_rag(df, OUTPUT_DIR) 
        # --- LLM Eval Plots ---
        plot_07_llm_eval_radar(df, OUTPUT_DIR)
        plot_08_llm_eval_bars(df, OUTPUT_DIR)
        plot_09_llm_eval_diff_box(df, OUTPUT_DIR)
        # --- Correlation & Relationship Plots ---
        plot_10_correlation_heatmap(df, OUTPUT_DIR)
        plot_11_retrieval_time_vs_llm_time_rag(df, OUTPUT_DIR)
        plot_12_citations_vs_specificity_score(df, OUTPUT_DIR)
        # --- Extra Performance Plot ---
        plot_13_overall_eval_time_dist(df, OUTPUT_DIR)s
        save_llm_eval_summary_table(df, OUTPUT_DIR)
        save_performance_summary_table(df, OUTPUT_DIR)

        logger.info(f"\nOutput saved to directory: {OUTPUT_DIR}")
        logger.info("--- Plotting & Table Generation Complete ---")
    else:
        logger.error("DataFrame is empty or not loaded. Cannot generate plots or tables.")