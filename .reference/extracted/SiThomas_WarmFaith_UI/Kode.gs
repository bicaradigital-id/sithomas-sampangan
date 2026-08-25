const SPREADSHEET_ID = '1o62caZjEAh_1BbuQXrMdcdyN3W3Ll8RYeVYOH3lbvaU';
const APP_NAME = 'SITHOMAS';
const LOGO_URL = 'https://drive.google.com/thumbnail?id=1D-D5vLZBRtcR5_msq279YU1iy1DDHedO&sz=w1000';

const CACHE_KEYS = {
  SUMMARY: 'sithomas_summary_data'
};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_NAME + ' - Sistem Informasi Pendataan Umat')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetByName(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet ' + sheetName + ' tidak ditemukan. Jalankan SetupDatabase terlebih dahulu.');
  }
  return sheet;
}

function generateId() {
  return Utilities.getUuid();
}

function nowISO() {
  return new Date().toISOString();
}

function successResponse(data, message) {
  return { success: true, data: data, message: message || 'Berhasil' };
}

function errorResponse(error, fallbackMessage) {
  return { success: false, data: null, message: error && error.message ? error.message : (fallbackMessage || 'Terjadi kesalahan') };
}

function hashPassword(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str || '').trim());
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function sheetToObjects(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

function clearAppCache() {
  try {
    CacheService.getScriptCache().removeAll([CACHE_KEYS.SUMMARY]);
  } catch (e) {}
}

// -------------------------------------------------------------
// SETUP DATABASE (SINKRONISASI HASH PASSWORD ADMIN)
// -------------------------------------------------------------
function SetupDatabase() {
  const ss = getSpreadsheet();
  
  // 1. Setup Sheet Users
  let userSheet = ss.getSheetByName('users');
  const userHeaders = ['id', 'username', 'password_hash', 'name', 'role', 'no_kk', 'created_at', 'updated_at', 'deleted_at'];
  
  if (!userSheet) {
    userSheet = ss.insertSheet('users');
    userSheet.appendRow(userHeaders);
  } else {
    const existingHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn() || 1).getDisplayValues()[0];
    if (!existingHeaders || existingHeaders.length === 0 || existingHeaders[0] === '') {
      userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    }
  }
  
  // 2. Setup Sheet Members
  let memberSheet = ss.getSheetByName('members');
  const memberHeaders = [
    'id', 'no_kk', 'nama_lengkap', 'nama_baptis', 'hubungan_keluarga', 
    'agama', 'status_perkawinan', 'pendidikan_terakhir', 'pekerjaan', 'profesi',
    'created_at', 'updated_at', 'deleted_at'
  ];
  
  if (!memberSheet) {
    memberSheet = ss.insertSheet('members');
    memberSheet.appendRow(memberHeaders);
  } else {
    const existingMemberHeaders = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn() || 1).getDisplayValues()[0];
    if (!existingMemberHeaders || existingMemberHeaders.length === 0 || existingMemberHeaders[0] === '') {
      memberSheet.getRange(1, 1, 1, memberHeaders.length).setValues([memberHeaders]);
    }
  }

  // 3. Force Seed/Update Password Hash Admin Default
  const userValues = userSheet.getDataRange().getDisplayValues();
  let adminRowIndex = -1;

  for (let i = 1; i < userValues.length; i++) {
    if (String(userValues[i][1]).toLowerCase().trim() === 'admin' && !userValues[i][8]) {
      adminRowIndex = i;
      break;
    }
  }

  // Hash SHA-256 untuk "admin123": 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
  const defaultAdminHash = hashPassword('admin123');

  if (adminRowIndex === -1) {
    userSheet.appendRow([
      generateId(),
      'admin',
      defaultAdminHash,
      'Administrator Utama',
      'admin',
      '',
      nowISO(),
      nowISO(),
      ''
    ]);
  } else {
    // Paksa perbarui password_hash pada kolom ke-3 (password_hash)
    const actualRow = adminRowIndex + 1;
    userSheet.getRange(actualRow, 3).setValue(defaultAdminHash);
    userSheet.getRange(actualRow, 8).setValue(nowISO());
  }

  clearAppCache();
  return successResponse(null, 'Database SITHOMAS berhasil disiapkan! Password Admin: admin123');
}

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------
function login(payload) {
  try {
    if (!payload) return errorResponse(null, 'Payload login tidak valid!');

    const type = payload.type; // 'admin' atau 'umat'
    const usernameOrPin = String(payload.usernameOrPin || '').trim();
    const password = String(payload.password || '').trim();

    if (!usernameOrPin) {
      return errorResponse(null, type === 'admin' ? 'Username wajib diisi!' : '4 digit terakhir No KK wajib diisi!');
    }

    if (type === 'admin') {
      if (!password) {
        return errorResponse(null, 'Password admin wajib diisi!');
      }

      const userSheet = getSheetByName('users');
      const users = sheetToObjects(userSheet).filter(u => !u.deleted_at);
      const inputHash = hashPassword(password);
      const inputUsername = usernameOrPin.toLowerCase();

      const admin = users.find(u => 
        String(u.role).toLowerCase().trim() === 'admin' && 
        String(u.username).toLowerCase().trim() === inputUsername && 
        String(u.password_hash).trim() === inputHash
      );

      if (!admin) {
        return errorResponse(null, 'Username atau password admin salah!');
      }
      
      return successResponse({
        id: admin.id,
        name: admin.name || 'Administrator',
        role: 'admin',
        no_kk: ''
      }, 'Login Admin Berhasil');

    } else {
      // Login Kepala Keluarga via 4 digit terakhir No KK
      const memberSheet = getSheetByName('members');
      const members = sheetToObjects(memberSheet).filter(m => !m.deleted_at);
      
      const matchedMember = members.find(m => {
        const cleanKK = String(m.no_kk).trim();
        return cleanKK.endsWith(usernameOrPin) && cleanKK.length >= 4;
      });

      if (!matchedMember) {
        return errorResponse(null, '4 digit terakhir Nomor KK tidak terdaftar!');
      }

      const familyKK = String(matchedMember.no_kk).trim();
      const headOfFamily = members.find(m => 
        String(m.no_kk).trim() === familyKK && 
        String(m.hubungan_keluarga).toLowerCase().includes('kepala')
      ) || matchedMember;

      return successResponse({
        id: 'umat-' + familyKK,
        name: headOfFamily.nama_lengkap,
        role: 'umat',
        no_kk: familyKK
      }, 'Login Umat Berhasil');
    }
  } catch (err) {
    return errorResponse(err, 'Gagal memproses login');
  }
}

// -------------------------------------------------------------
// DATA RETRIEVAL & CRUD
// -------------------------------------------------------------
function getFamilyKKList() {
  try {
    const sheet = getSheetByName('members');
    const members = sheetToObjects(sheet).filter(m => !m.deleted_at);
    
    const kkMap = {};
    members.forEach(m => {
      const kk = String(m.no_kk).trim();
      if (!kk) return;

      if (!kkMap[kk]) {
        kkMap[kk] = { no_kk: kk, kepala_keluarga: '-' };
      }
      if (String(m.hubungan_keluarga).toLowerCase().includes('kepala')) {
        kkMap[kk].kepala_keluarga = m.nama_lengkap;
      }
    });

    return successResponse(Object.values(kkMap), 'Daftar KK dimuat');
  } catch (e) {
    return errorResponse(e, 'Gagal mengambil daftar KK');
  }
}

function getMembers(params) {
  try {
    params = params || {};
    const page = parseInt(params.page || 1, 10);
    const limit = parseInt(params.limit || 10, 10);
    const search = String(params.search || '').toLowerCase().trim();
    const filterKK = String(params.filterKK || '').trim();
    const userRole = params.userRole;
    const userKK = String(params.userKK || '').trim();

    const sheet = getSheetByName('members');
    let members = sheetToObjects(sheet).filter(m => !m.deleted_at);

    // Proteksi Akses
    if (userRole === 'umat') {
      members = members.filter(m => String(m.no_kk).trim() === userKK);
    } else if (filterKK) {
      members = members.filter(m => String(m.no_kk).trim() === filterKK);
    }

    if (search) {
      members = members.filter(m => 
        String(m.nama_lengkap).toLowerCase().includes(search) ||
        String(m.no_kk).toLowerCase().includes(search) ||
        String(m.nama_baptis).toLowerCase().includes(search) ||
        String(m.profesi).toLowerCase().includes(search)
      );
    }

    const total = members.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedRows = members.slice(startIndex, startIndex + limit);

    return successResponse({
      rows: paginatedRows,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, 'Data berhasil dimuat');
  } catch (err) {
    return errorResponse(err, 'Gagal memuat data anggota');
  }
}

function saveMember(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetByName('members');
    const values = sheet.getDataRange().getDisplayValues();

    const id = payload.id ? String(payload.id).trim() : '';
    let clean_no_kk = String(payload.no_kk || '').trim();

    if (!clean_no_kk || clean_no_kk.length < 4) {
      return errorResponse(null, 'Nomor KK tidak valid (minimal 4 karakter)!');
    }
    if (!payload.nama_lengkap) {
      return errorResponse(null, 'Nama Lengkap wajib diisi!');
    }

    clearAppCache();

    if (id) {
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === id) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return errorResponse(null, 'Data tidak ditemukan untuk diperbarui!');
      }

      const actualRow = rowIndex + 1;
      const updatedRow = [
        id,
        "'" + clean_no_kk,
        payload.nama_lengkap || '',
        payload.nama_baptis || '',
        payload.hubungan_keluarga || 'Anggota',
        payload.agama || 'Katolik',
        payload.status_perkawinan || 'Belum Kawin',
        payload.pendidikan_terakhir || '-',
        payload.pekerjaan || '-',
        payload.profesi || '-',
        values[rowIndex][10] || nowISO(),
        nowISO(),
        ''
      ];

      sheet.getRange(actualRow, 1, 1, updatedRow.length).setValues([updatedRow]);
      return successResponse(null, 'Data anggota berhasil diperbarui!');
    } else {
      const newId = generateId();
      const newRow = [
        newId,
        "'" + clean_no_kk,
        payload.nama_lengkap || '',
        payload.nama_baptis || '',
        payload.hubungan_keluarga || 'Anggota',
        payload.agama || 'Katolik',
        payload.status_perkawinan || 'Belum Kawin',
        payload.pendidikan_terakhir || '-',
        payload.pekerjaan || '-',
        payload.profesi || '-',
        nowISO(),
        nowISO(),
        ''
      ];

      sheet.appendRow(newRow);
      return successResponse(null, 'Anggota keluarga berhasil ditambahkan!');
    }
  } catch (err) {
    return errorResponse(err, 'Gagal menyimpan data anggota');
  } finally {
    lock.releaseLock();
  }
}

function deleteMember(id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetByName('members');
    const values = sheet.getDataRange().getDisplayValues();
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === String(id).trim()) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) return errorResponse(null, 'Data tidak ditemukan!');

    const actualRow = rowIndex + 1;
    sheet.getRange(actualRow, 13).setValue(nowISO());
    clearAppCache();

    return successResponse(null, 'Data berhasil dihapus');
  } catch (e) {
    return errorResponse(e, 'Gagal menghapus data');
  } finally {
    lock.releaseLock();
  }
}

function getDashboardSummary() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CACHE_KEYS.SUMMARY);
    if (cached) {
      return successResponse(JSON.parse(cached), 'Data summary dari cache');
    }

    const sheet = getSheetByName('members');
    const members = sheetToObjects(sheet).filter(m => !m.deleted_at);

    const totalUmat = members.length;
    const uniqueKK = new Set(members.map(m => String(m.no_kk).trim()).filter(k => k !== '')).size;
    const totalKepalaKeluarga = members.filter(m => String(m.hubungan_keluarga).toLowerCase().includes('kepala')).length;

    const summary = {
      totalUmat: totalUmat,
      totalKK: uniqueKK,
      totalKepalaKeluarga: totalKepalaKeluarga
    };

    cache.put(CACHE_KEYS.SUMMARY, JSON.stringify(summary), 300);
    return successResponse(summary, 'Data summary berhasil dimuat');
  } catch (e) {
    return errorResponse(e, 'Gagal memuat summary dashboard');
  }
}