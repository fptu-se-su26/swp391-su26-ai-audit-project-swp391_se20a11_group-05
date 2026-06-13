package com.example.smartcity.rag.metrics;

import io.micrometer.core.instrument.*;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Custom Prometheus metrics cho RAG pipeline.
 */
@Component
@Getter
public class RagMetrics {

    private final Counter queryCounter;
    private final Counter errorCounter;
    private final Timer retrievalTimer;
    private final Timer llmTimer;
    private final Timer totalTimer;
    private final DistributionSummary chunkCountDistribution;
    private final Gauge activeQueries;
    private final AtomicInteger activeQueriesCount;
    
    public RagMetrics(MeterRegistry registry) {
        // Query counters
        this.queryCounter = Counter.builder("rag.queries.total")
            .description("Total number of RAG queries")
            .tag("type", "all")
            .register(registry);
        
        this.errorCounter = Counter.builder("rag.errors.total")
            .description("Total number of RAG errors")
            .register(registry);
        
        // Latency timers
        this.retrievalTimer = Timer.builder("rag.retrieval.duration")
            .description("Time spent on retrieval (Vector + BM25 + RRF)")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
        
        this.llmTimer = Timer.builder("rag.llm.duration")
            .description("Time spent on LLM generation")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
        
        this.totalTimer = Timer.builder("rag.query.duration")
            .description("Total RAG pipeline duration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
        
        // Distribution summaries
        this.chunkCountDistribution = DistributionSummary.builder("rag.chunks.count")
            .description("Number of chunks retrieved per query")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
        
        // Active queries gauge
        this.activeQueriesCount = new AtomicInteger(0);
        this.activeQueries = Gauge.builder("rag.queries.active", activeQueriesCount, AtomicInteger::get)
            .description("Number of currently active queries")
            .register(registry);
    }
    
    public void recordQuery() {
        queryCounter.increment();
        activeQueriesCount.incrementAndGet();
    }
    
    public void recordQueryComplete() {
        activeQueriesCount.decrementAndGet();
    }
    
    public void recordError(String errorType) {
        errorCounter.increment();
        activeQueriesCount.decrementAndGet();
    }
    
    public void recordRetrievalLatency(long millis) {
        retrievalTimer.record(millis, java.util.concurrent.TimeUnit.MILLISECONDS);
    }
    
    public void recordLLMLatency(long millis) {
        llmTimer.record(millis, java.util.concurrent.TimeUnit.MILLISECONDS);
    }
    
    public void recordTotalLatency(long millis) {
        totalTimer.record(millis, java.util.concurrent.TimeUnit.MILLISECONDS);
    }
    
    public void recordChunkCount(int count) {
        chunkCountDistribution.record(count);
    }
}
