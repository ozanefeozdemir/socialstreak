package com.example.back.search.service;

import co.elastic.clients.elasticsearch._types.query_dsl.FunctionScoreQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier;
import com.example.back.search.model.UserDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public List<UserDocument> searchUsers(String queryText, String searcherId, List<String> blockedUserIds, int page, int size) {
        
        // 1. Must Context (Filters)
        Query privacyFilter = QueryBuilders.term(t -> t.field("privacySearchable").value(true));
        Query notSearcherFilter = QueryBuilders.bool(b -> b.mustNot(mn -> mn.term(t -> t.field("id").value(searcherId))));
        
        // 2. Should Context (Scoring)
        Query exactUsernameMatch = QueryBuilders.term(t -> t.field("username").value(queryText).boost(10.0f));
        Query fuzzyFullNameMatch = QueryBuilders.match(m -> m.field("fullName").query(queryText).fuzziness("AUTO").boost(2.0f));
        Query searchAsYouTypeUsername = QueryBuilders.multiMatch(m -> m
                .query(queryText)
                .fields("username", "username._2gram", "username._3gram")
                .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BoolPrefix)
                .boost(5.0f)
        );

        // Combine into bool query
        Query boolQuery = QueryBuilders.bool(b -> b
                .filter(privacyFilter)
                .filter(notSearcherFilter)
                .should(exactUsernameMatch)
                .should(fuzzyFullNameMatch)
                .should(searchAsYouTypeUsername)
                .minimumShouldMatch("1")
        );
        
        Query finalBoolQuery;
        // Add blocklist filter if needed
        if (blockedUserIds != null && !blockedUserIds.isEmpty()) {
            Query blockListFilter = QueryBuilders.bool(b -> {
                for (String blockedId : blockedUserIds) {
                    b.mustNot(mn -> mn.term(t -> t.field("id").value(blockedId)));
                }
                return b;
            });
            finalBoolQuery = QueryBuilders.bool(b -> b.must(boolQuery).filter(blockListFilter));
        } else {
            finalBoolQuery = boolQuery;
        }

        // 3. Function Score for Mutual Friends Boost
        // Using FieldValueFactor to boost based on mutualFriendsCount
        Query functionScoreQuery = QueryBuilders.functionScore(fs -> fs
                .query(finalBoolQuery)
                .functions(f -> f
                        .fieldValueFactor(fvf -> fvf
                                .field("mutualFriendsCount")
                                .modifier(FieldValueFactorModifier.Log2p)
                                .missing(0.0)
                                .factor(1.5)
                        )
                )
                .boostMode(co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode.Multiply)
        );

        // Execute Query
        NativeQuery nativeQuery = new NativeQueryBuilder()
                .withQuery(functionScoreQuery)
                .withPageable(PageRequest.of(page, size))
                .build();

        SearchHits<UserDocument> searchHits = elasticsearchOperations.search(nativeQuery, UserDocument.class);

        return searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }
}
