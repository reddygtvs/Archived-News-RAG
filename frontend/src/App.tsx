// frontend/src/App.tsx
import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  CssBaseline,
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Link,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./App.css";

const API_URL = "http://localhost:5001/api/query"; // Match Flask port

interface RetrievedContextItem {
  text: string;
  source: string;
  title: string;
  date: string;
  article_id?: string;
  min_distance?: number;
}

interface ApiResponse {
  standard_response: string;
  rag_response: string;
  retrieved_chunks: RetrievedContextItem[];
  error?: string;
}

function App() {
  const [query, setQuery] = useState<string>("");
  const [standardResponse, setStandardResponse] = useState<string>("");
  const [ragResponse, setRagResponse] = useState<string>("");
  const [retrievedContext, setRetrievedContext] = useState<
    RetrievedContextItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError("");
    setStandardResponse("");
    setRagResponse("");
    setRetrievedContext([]); // To clear previous context

    try {
      const response = await axios.post<ApiResponse>(API_URL, { query });
      setStandardResponse(response.data.standard_response);
      setRagResponse(response.data.rag_response);
      setRetrievedContext(response.data.retrieved_chunks);
    } catch (err) {
      console.error("API Error:", err);
      let errorMsg = "Failed to fetch response from backend.";
      if (axios.isAxiosError(err)) {
        errorMsg =
          err.response?.data?.error ||
          err.message ||
          "An unknown Axios error occurred.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date string or return 'N/A'
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <>
      <CssBaseline />
      <Container
        maxWidth="xl"
        sx={{ paddingY: "2rem", paddingX: { xs: "1rem", md: "2rem" } }}
      >
        <Typography variant="h4" gutterBottom align="center" component="h1">
          Archived News RAG vs. Standard LLM
        </Typography>
        {/* Style hack */}
        <Typography
          variant="subtitle1"
          gutterBottom
          align="center"
          color="textSecondary"
          sx={{ mb: 3 }}
        >
          Querying events from The Guardian's 2015 Archive
        </Typography>

        <Paper
          elevation={3}
          sx={{
            padding: "1.5rem",
            marginBottom: "2.5rem",
            borderRadius: "8px",
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Enter your query about events/topics from 2015"
              variant="outlined"
              value={query}
              onChange={handleQueryChange}
              disabled={loading}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              size="large"
              sx={{ marginTop: "1rem", display: "block", mx: "auto" }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Ask"}
            </Button>
          </form>
          {error && (
            <Alert severity="error" sx={{ marginTop: "1.5rem" }}>
              {error}
            </Alert>
          )}
        </Paper>

        <Grid container spacing={4}>
          {/* Standard LLM Response */}
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{ height: "100%", borderRadius: "8px" }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom component="h2">
                  Standard LLM Response
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    maxHeight: "60vh",
                    pr: 1,
                    wordBreak: "break-word",
                  }}
                >
                  {" "}
                  {/* Added wordBreak to make things more manageable on the view */}
                  {loading && !standardResponse ? (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      height="100%"
                    >
                      <CircularProgress />
                    </Box>
                  ) : standardResponse ? (
                    // --- USE REACT-MARKDOWN ---
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <Typography variant="body1" paragraph {...props} />
                        ),
                        h1: ({ node, ...props }) => (
                          <Typography variant="h4" {...props} />
                        ),
                      }}
                    >
                      {standardResponse}
                    </ReactMarkdown>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No response yet or an error occurred.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* RAG Response */}
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{ height: "100%", borderRadius: "8px" }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom component="h2">
                  RAG Response (with 2015 News Context)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    maxHeight: "60vh",
                    pr: 1,
                    wordBreak: "break-word",
                  }}
                >
                  {" "}
                  {/* Added wordBreak */}
                  {loading && !ragResponse ? (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      height="100%"
                    >
                      <CircularProgress />
                    </Box>
                  ) : ragResponse ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <Typography variant="body1" paragraph {...props} />
                        ),
                      }}
                    >
                      {ragResponse}
                    </ReactMarkdown>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No response yet or an error occurred.
                    </Typography>
                  )}
                  {/* Retrieved Context Section */}
                  {retrievedContext.length > 0 && (
                    <Accordion
                      sx={{
                        marginTop: "1.5rem",
                        border: "1px solid #e0e0e0",
                        boxShadow: "none",
                        borderRadius: "4px",
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="retrieved-context-panel-content"
                        id="retrieved-context-panel-header"
                      >
                        <Typography variant="subtitle1">
                          Retrieved Context ({retrievedContext.length} article
                          {retrievedContext.length !== 1 ? "s" : ""})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails
                        sx={{
                          maxHeight: "300px",
                          overflowY: "auto",
                          display: "block",
                          backgroundColor: "#f9f9fa",
                          p: 1.5,
                        }}
                      >
                        {retrievedContext.map((item, index) => (
                          <Paper
                            key={item.article_id || index}
                            variant="outlined"
                            sx={{
                              padding: "1rem",
                              marginBottom: "1rem",
                              backgroundColor: "#fff",
                              borderRadius: "4px",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              component="h3"
                              gutterBottom
                            >
                              {item.title !== "Source Title Missing" &&
                              item.title ? (
                                item.source !== "Source URL Missing" &&
                                item.source ? (
                                  <Link
                                    href={item.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    underline="hover"
                                  >
                                    {item.title}
                                  </Link>
                                ) : (
                                  item.title
                                )
                              ) : item.source !== "Source URL Missing" &&
                                item.source ? (
                                <Link
                                  href={item.source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                >
                                  {item.source}
                                </Link>
                              ) : (
                                "Retrieved Article " + (index + 1)
                              )}
                            </Typography>
                            <Chip
                              label={`Date: ${formatDate(item.date)}`}
                              size="small"
                              sx={{ mb: 1, mr: 1 }}
                            />
                            {typeof item.min_distance === "number" && (
                              <Chip
                                label={`Relevance Score (Dist): ${item.min_distance.toFixed(
                                  4
                                )}`}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                maxHeight: "100px",
                                overflowY: "auto",
                                color: "text.secondary",
                              }}
                            >
                              {item.text}
                            </Typography>
                          </Paper>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default App;
