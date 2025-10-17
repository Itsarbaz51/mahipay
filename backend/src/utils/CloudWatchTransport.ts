// utils/CloudWatchTransport.ts
import Transport from "winston-transport";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

interface CloudWatchTransportOptions extends Transport.TransportStreamOptions {
  logGroupName: string;
  logStreamName: string;
  region?: string;
}

class CloudWatchTransport extends Transport {
  private cloudWatchLogs: CloudWatchLogs;
  private logGroupName: string;
  private logStreamName: string;
  private sequenceToken: string | undefined;

  constructor(opts: CloudWatchTransportOptions) {
    super(opts);

    this.cloudWatchLogs = new CloudWatchLogs({
      region: opts.region || "ap-south-1",
    });

    this.logGroupName = opts.logGroupName;
    this.logStreamName = opts.logStreamName;

    this.initializeStream();
  }

  private async initializeStream() {
    try {
      // Check if log group exists
      try {
        await this.cloudWatchLogs.describeLogGroups({
          logGroupNamePrefix: this.logGroupName,
        });
      } catch (error) {
        // Create log group if it doesn't exist
        await this.cloudWatchLogs.createLogGroup({
          logGroupName: this.logGroupName,
        });
      }

      // Check if log stream exists
      try {
        const describeResponse = await this.cloudWatchLogs.describeLogStreams({
          logGroupName: this.logGroupName,
          logStreamNamePrefix: this.logStreamName,
        });

        const stream = describeResponse.logStreams?.find(
          (s) => s.logStreamName === this.logStreamName
        );

        this.sequenceToken = stream?.uploadSequenceToken;
      } catch (error) {
        // Create log stream if it doesn't exist
        await this.cloudWatchLogs.createLogStream({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        });
      }
    } catch (error) {
      console.error("Failed to initialize CloudWatch stream:", error);
    }
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    try {
      const logEvent = {
        message: JSON.stringify({
          level: info.level,
          message: info.message,
          timestamp: info.timestamp,
          ...info.metadata,
        }),
        timestamp: Date.now(),
      };

      const putLogEventsParams: any = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
      };

      if (this.sequenceToken) {
        putLogEventsParams.sequenceToken = this.sequenceToken;
      }

      const response =
        await this.cloudWatchLogs.putLogEvents(putLogEventsParams);
      this.sequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error("CloudWatch log error:", error);
    }

    callback();
  }
}

export default CloudWatchTransport;
