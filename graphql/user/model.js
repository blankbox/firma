module.exports = [
  {
    name:'UserProfile',
    config:{
      fields:{
        user_uid: {'type': 'uuid'},
        login_uid: {
          type: 'map',
          typeDef: '<text, text>' //login_uid: audience
        },
        first_name    : 'text',
        last_name : 'text',
        email     : 'text',
        username: 'text',
        blocked: {'type':'boolean', 'default':false},
        deleted: {'type':'boolean', 'default':false},
        private: {'type':'boolean', 'default':false},
        client_data: {
          type: 'map',
          typeDef: '<text, text>'
        }
      },
      table_name:'user_profile',
      key:['user_uid'],
      materialized_views: {
        user_by_email: {
          select: ['*'],
          key : ['email', 'user_uid'],
        }
      },
      custom_indexes: [
        {
          on: 'email',
          using: 'org.apache.cassandra.index.sasi.SASIIndex',
          options: {
            'mode': 'CONTAINS',
            'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
            'tokenization_enable_stemming': 'true',
            'tokenization_locale': 'en',
            'tokenization_skip_stop_words': 'true',
            'analyzed': 'true',
            'tokenization_normalize_lowercase': 'true'
          }
        },
        {
          on: 'first_name',
          using: 'org.apache.cassandra.index.sasi.SASIIndex',
          options: {
            'mode': 'CONTAINS',
            'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
            'tokenization_enable_stemming': 'true',
            'tokenization_locale': 'en',
            'tokenization_skip_stop_words': 'true',
            'analyzed': 'true',
            'tokenization_normalize_lowercase': 'true'
          }
        },
        {
          on: 'last_name',
          using: 'org.apache.cassandra.index.sasi.SASIIndex',
          options: {
            'mode': 'CONTAINS',
            'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.StandardAnalyzer',
            'tokenization_enable_stemming': 'true',
            'tokenization_locale': 'en',
            'tokenization_skip_stop_words': 'true',
            'analyzed': 'true',
            'tokenization_normalize_lowercase': 'true'
          }
        },
      ],
    }
  }
];
