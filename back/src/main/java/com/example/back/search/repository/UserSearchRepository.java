package com.example.back.search.repository;

import com.example.back.search.model.UserDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, String> {
}
