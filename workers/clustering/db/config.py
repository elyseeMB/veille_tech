from abc import ABC, abstractmethod
from pgvector.psycopg2 import register_vector
import psycopg2
from psycopg2 import pool
import os

class BaseConnection(ABC):
    @abstractmethod
    def get(self):
        pass

class PostgresConnection(BaseConnection):
    __pool: pool.SimpleConnectionPool

    def __init__(self):
        dsn = os.environ["DATABASE_URL"]
        self.__pool = pool.SimpleConnectionPool(1, 5, dsn)
        conn = self.__pool.getconn()
        register_vector(conn)
        conn.close()

    def get(self):
        conn = self.__pool.getconn()
        register_vector(conn)
        return conn

    def put(self, conn):
        self.__pool.putconn(conn)
