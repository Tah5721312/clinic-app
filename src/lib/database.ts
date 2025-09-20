import dotenv from 'dotenv';
dotenv.config();

import oracledb from 'oracledb';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

let pool: oracledb.Pool | null = null;

// إنشاء logger مخصص لتجنب استخدام console
const logger = {
  log: (message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  error: (message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  },
  warn: (message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  },
};

/**
 * Initialize Oracle connection pool
 */
export async function initializePool() {
  if (!pool) {
    try {
      logger.log('🔄 محاولة الاتصال بقاعدة البيانات...');
      logger.log(
        `بيانات الاتصال: ${JSON.stringify({
          user: process.env.ORACLE_USER,
          connectString: process.env.ORACLE_CONNECTION_STRING,
          clientPath: process.env.ORACLE_CLIENT_PATH,
        })}`
      );

      // تهيئة مكتب Oracle Client إذا كان المسار موجوداً
      if (process.env.ORACLE_CLIENT_PATH) {
        try {
          oracledb.initOracleClient({
            libDir: process.env.ORACLE_CLIENT_PATH,
          });
          logger.log('✅ تم تهيئة Oracle Client بنجاح');
        } catch (clientError) {
          if (clientError instanceof Error) {
            logger.warn(
              `⚠️  لم يتم تهيئة Oracle Client، جاري المحاولة بدونها: ${clientError.message}`
            );
          } else {
            logger.warn(
              `⚠️  لم يتم تهيئة Oracle Client، جاري المحاولة بدونها: ${String(
                clientError
              )}`
            );
          }
        }
      }

      // محاولة إنشاء connection pool
      pool = await oracledb.createPool({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECTION_STRING,
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1,
        poolTimeout: 60,
        queueTimeout: 30000,
      });

      logger.log('✅ تم إنشاء connection pool بنجاح');

      // اختبار الاتصال
      const testConnection = await pool.getConnection();
      await testConnection.execute('SELECT 1 FROM DUAL');
      await testConnection.close();

      logger.log('✅ تم اختبار الاتصال بقاعدة البيانات بنجاح');
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(`❌ فشل الاتصال بقاعدة البيانات: ${err.message}`);
      } else {
        logger.error('❌ فشل الاتصال بقاعدة البيانات: غير معروف');
      }
      throw err;
    }
  }
  return pool;
}

/**
 * Get a connection from the pool
 */
export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    await initializePool();
  }

  try {
    const connection = await pool?.getConnection();
    if (!connection) {
      throw new Error('Failed to get connection from pool');
    }
    return connection;
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`❌ Error getting connection from pool: ${err.message}`);
    } else {
      logger.error('❌ Error getting connection from pool: غير معروف');
    }
    throw err;
  }
}

/**
 * Execute a SQL query and return results
 */
export async function executeQuery<T>(
  query: string,
  params: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<{
  rows: T[];
  metaData?: oracledb.Metadata<unknown>[];
  rowsAffected?: number;
  outBinds?: oracledb.BindParameters;
}> {
  let connection: oracledb.Connection | undefined;

  try {
    connection = await getConnection();

    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });

    return {
      rows: (result.rows as T[]) || [],
      metaData: result.metaData,
      rowsAffected: result.rowsAffected,
      outBinds: result.outBinds as oracledb.BindParameters, // إصلاح المشكلة الأولى
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`❌ Error executing query: ${err.message}`);
    } else {
      logger.error('❌ Error executing query: غير معروف');
    }
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr: unknown) {
        if (closeErr instanceof Error) {
          logger.error(`❌ Error closing connection: ${closeErr.message}`);
        } else {
          logger.error('❌ Error closing connection: غير معروف');
        }
      }
    }
  }
}

/**
 * Check if database is connected
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await executeQuery<{ DUMMY: string }>(
      'SELECT 1 AS DUMMY FROM DUAL'
    );
    return result.rows.length > 0;
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`❌ Database connection check failed: ${err.message}`);
    } else {
      logger.error('❌ Database connection check failed: غير معروف');
    }
    return false;
  }
}

export async function executeReturningQuery<T>(
  query: string,
  params: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<{
  rows: T[];
  outBinds?: oracledb.BindParameters;
}> {
  let connection: oracledb.Connection | undefined;

  try {
    connection = await getConnection();

    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });

    return {
      rows: (result.rows as T[]) || [],
      outBinds: result.outBinds as oracledb.BindParameters, // إصلاح المشكلة الثانية
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`❌ Error executing returning query: ${err.message}`);
    } else {
      logger.error('❌ Error executing returning query: غير معروف');
    }
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr: unknown) {
        if (closeErr instanceof Error) {
          logger.error(`❌ Error closing connection: ${closeErr.message}`);
        } else {
          logger.error('❌ Error closing connection: غير معروف');
        }
      }
    }
  }
}
