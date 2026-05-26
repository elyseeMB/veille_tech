package awsconfig

import (
	"context"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

type Clients struct {
	SSM *ssm.Client
	S3  *s3.Client
}

func NewClients(ctx context.Context) (*Clients, error) {
	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &Clients{
		SSM: ssm.NewFromConfig(cfg),
		S3:  s3.NewFromConfig(cfg),
	}, nil
}
