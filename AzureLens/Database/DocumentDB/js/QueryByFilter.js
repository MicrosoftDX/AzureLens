///<reference path="./docdb.intellisense.js" />

/**
 * @param {String} filterQuery - Optional filter for query.
 */
function QueryByFilter(filterQuery, continuationToken) {
    var ErrorCode = {
        REQUEST_ENTITY_TOO_LARGE: 413,
    }

    var collection = getContext().getCollection();
    var collectionLink = collection.getSelfLink();

    var result = new Array();

    tryQuery({});

    function tryQuery(options) {
        var isAccepted = (filterQuery && filterQuery.length) ?
            collection.queryDocuments(collectionLink, filterQuery, options, callback) :
            collection.readDocuments(collectionLink, options, callback);
    }

    /** 
     * queryDocuments callback. 
     * @param {Error} err - Error object in case of error/exception. 
     * @param {Array} queryFeed - array containing results of the query. 
     * @param {ResponseOptions} responseOptions. 
     */
    function callback(err, queryFeed, responseOptions) {
        if (err) {
            throw err;
        }

        queryFeed.forEach(function (element, index, array) {
            result[result.length] = element;
        });

        if (responseOptions.continuation) {
            tryQuery({ continuation: responseOptions.continuation });
        } else {
            fillResponse();
        }
    }

    function fillResponse() {
        var continuationResult = result;
        if (continuationToken) continuationResult = result.slice(continuationToken);
        else continuationToken = 0;

        var response = getContext().getResponse();
        response.setBody(null);

        var i = 0;
        for (; i < continuationResult.length; i++) {
            try {
                response.appendBody(JSON.stringify(continuationResult[i]));
            } catch (ex) {
                if (!ex.number == ErrorCode.REQUEST_ENTITY_TOO_LARGE) throw ex;
                break;
            }
        }

        var partialResult = continuationResult;
        var newContinuation = null;
        if (i < continuationResult.length) {
            partialResult = continuationResult.slice(0, i);
        }

        response.setBody({ result: result, continuation: newContinuation });
    }
}