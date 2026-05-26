package cfg

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server ServerConfig `yaml:"server"`
	DB     DBConfig     `yaml:"db"`
	AWS    AWSConfig    `yaml:"aws"`
	Log    LogConfig    `yaml:"log"`
}

type ServerConfig struct {
	Port int        `yaml:"port"`
	CORS CORSConfig `yaml:"cors"`
}

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins"`
}

type DBConfig struct {
	URL string `yaml:"url"`
}

type AWSConfig struct {
	Region   string `yaml:"region"`
	Endpoint string `yaml:"endpoint"`
}

type LogConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

func Load(path string) (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{Port: 8081},
		Log:    LogConfig{Level: "debug", Format: "text"},
		AWS:    AWSConfig{Region: "us-east-1"},
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, fmt.Errorf("read config: %w", err)
		}
		return cfg, nil
	}

	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	return cfg, nil
}

func (c *Config) DatabaseURL() string {
	if v := os.Getenv("DATABASE_URL"); v != "" {
		return v
	}
	return c.DB.URL
}

func (c *Config) AllowedOrigins() []string {
	if v := os.Getenv("ALLOWED_ORIGINS"); v != "" {
		return []string{v}
	}
	return c.Server.CORS.AllowedOrigins
}

func (c *Config) Port() int {
	if v := os.Getenv("PORT"); v != "" {
		p := 0
		fmt.Sscanf(v, "%d", &p)
		if p > 0 {
			return p
		}
	}
	return c.Server.Port
}
