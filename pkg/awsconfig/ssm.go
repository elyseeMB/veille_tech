package awsconfig

import (
	"context"
	"log/slog"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

func LoadSecrets(ctx context.Context, ssmClient *ssm.Client, params map[string]string) {
	if os.Getenv("AWS_LAMBDA_RUNTIME_API") == "" || os.Getenv("LOCAL_DEV") == "true" {
		return
	}

	for envKey, ssmPath := range params {
		if ssmPath == "" {
			continue
		}
		out, err := ssmClient.GetParameter(ctx, &ssm.GetParameterInput{
			Name:           aws.String(ssmPath),
			WithDecryption: aws.Bool(true),
		})
		if err != nil {
			slog.Error("failed to get ssm param", "path", ssmPath, "error", err)
			continue
		}
		os.Setenv(envKey, *out.Parameter.Value)
	}
}
