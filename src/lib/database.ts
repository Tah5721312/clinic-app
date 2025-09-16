
import dotenv from 'dotenv';
dotenv.config();

import oracledb from 'oracledb';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

let pool: oracledb.Pool | null = null;

/**
 * Initialize Oracle connection pool
 */
export async function initializePool() {

//   console.log('User:', process.env.ORACLE_USER);
// console.log('Password:', process.env.ORACLE_PASSWORD ? '***' : 'غير معرف');
// console.log('Connect String:', process.env.ORACLE_CONNECTION_STRING);
// console.log('Client Path:', process.env.ORACLE_CLIENT_PATH);

  if (!pool) {
    try {
      console.log('🔄 محاولة الاتصال بقاعدة البيانات...');
      console.log('بيانات الاتصال:', {
        user: process.env.ORACLE_USER,
        connectString: process.env.ORACLE_CONNECTION_STRING,
        clientPath: process.env.ORACLE_CLIENT_PATH
      });

      // تهيئة مكتب Oracle Client إذا كان المسار موجوداً
     if (process.env.ORACLE_CLIENT_PATH) {
  try {
    oracledb.initOracleClient({
      libDir: process.env.ORACLE_CLIENT_PATH
    });
    console.log('✅ تم تهيئة Oracle Client بنجاح');
  } catch (clientError) {
    if (clientError instanceof Error) {
      console.warn('⚠️  لم يتم تهيئة Oracle Client، جاري المحاولة بدونها:', clientError.message);
    } else {
      console.warn('⚠️  لم يتم تهيئة Oracle Client، جاري المحاولة بدونها:', clientError);
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

      console.log('✅ تم إنشاء connection pool بنجاح');

      // اختبار الاتصال
      const testConnection = await pool.getConnection();
      await testConnection.execute('SELECT 1 FROM DUAL');
      await testConnection.close();
      
      console.log('✅ تم اختبار الاتصال بقاعدة البيانات بنجاح');
    }
    catch (err: unknown) {
  if (err instanceof Error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
  } else {
    console.error('❌ فشل الاتصال بقاعدة البيانات: غير معروف');
  }
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
    const connection = await pool!.getConnection();
    return connection;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Error getting connection from pool:', err.message);
    } else {
      console.error('❌ Error getting connection from pool: غير معروف');
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
  metaData?: oracledb.Metadata<any>[];
  rowsAffected?: number;
  outBinds?: any;
}> {
  let connection: oracledb.Connection | undefined;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    
    return {
      rows: (result.rows as T[]) || [],
      metaData: result.metaData,
      rowsAffected: result.rowsAffected,
      outBinds: result.outBinds
    };
  }
  
 catch (err: unknown) {
  if (err instanceof Error) {
    console.error('❌ Error executing query:', err.message);
  } else {
    console.error('❌ Error executing query: غير معروف');
  }
  // إعادة الرمي أو التعامل حسب الحاجة
  throw err;
}

  
  
  finally {
    if (connection) {
      try {
        await connection.close();
      } 
      
     catch (closeErr: unknown) {
  if (closeErr instanceof Error) {
    console.error('❌ Error closing connection:', closeErr.message);
  } else {
    console.error('❌ Error closing connection: غير معروف');
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
    return result.rows.length > 0 ;
  } 
  
  
 catch (err: unknown) {
  if (err instanceof Error) {
    console.error('❌ Database connection check failed:', err.message);
  } else {
    console.error('❌ Database connection check failed: غير معروف');
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
  outBinds?: any;
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
      outBinds: result.outBinds,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ Error executing returning query:', err.message);
    } else {
      console.error('❌ Error executing returning query: غير معروف');
    }
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr: unknown) {
        if (closeErr instanceof Error) {
          console.error('❌ Error closing connection:', closeErr.message);
        } else {
          console.error('❌ Error closing connection: غير معروف');
        }
      }
    }
  }
}





