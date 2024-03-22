import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Movie, MovieAward, MovieCast } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

type ResponseBody = {
  data: {
    awardDetail: MovieAward;
  };
};

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const awardBody = parameters?.awardBody;
    const movieId = parameters?.movieId
      ? parseInt(parameters.movieId)
      : undefined;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    } else if (!awardBody) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing award body" }),
      };
    }

    const getCommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { awardBody: awardBody, movieId: movieId },
      })
    );
    if (!getCommandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }
    const body: ResponseBody = {
      data: { awardDetail: getCommandOutput.Item as MovieAward },
    };

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
