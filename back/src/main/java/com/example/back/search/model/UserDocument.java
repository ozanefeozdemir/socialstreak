package com.example.back.search.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(indexName = "users")
public class UserDocument {

    @Id
    @Field(type = FieldType.Keyword)
    private String id; // This will map to User.id.toString()

    @Field(type = FieldType.Search_As_You_Type)
    private String username;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String fullName; // Combined name + surname

    @Field(type = FieldType.Integer)
    private Integer mutualFriendsCount;

    @Field(type = FieldType.Boolean)
    private Boolean privacySearchable;

}
