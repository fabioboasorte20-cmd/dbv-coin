// DBV COIN - GOOGLE APPS SCRIPT
// Banco online do DBV Coin usando Google Sheets.
// Publique como Web App: Executar como "Eu" e acesso "Qualquer pessoa".
//
// IMPORTANTE:
// 1) Depois de publicar, copie a URL /exec para GOOGLE_SCRIPT_URL no index.html.
// 2) A planilha usada deve ser a mesma vinculada a este projeto Apps Script.
// 3) Em produção, troque as senhas de demonstração por senhas reais.
//
// Abas criadas automaticamente:
// Units, Users, Transactions, Products

const SHEETS = {
  units: 'Units',
  users: 'Users',
  transactions: 'Transactions',
  products: 'Products'
};

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(ss, SHEETS.units, ['name']);
  ensureSheet_(ss, SHEETS.users, ['name','email','pass','unit','role','balance']);
  ensureSheet_(ss, SHEETS.transactions, ['userEmail','desc','amount','date','productId']);
  ensureSheet_(ss, SHEETS.products, ['id','name','price','stock']);

  const units = getSheet_(SHEETS.units);
  if (units.getLastRow() === 1) {
    ['Órion','Plêiades','Crux','Diretoria'].forEach(u => units.appendRow([u]));
  }

  const users = getSheet_(SHEETS.users);
  if (users.getLastRow() === 1) {
    users.appendRow(['Diretor Roberto','admin@email.com','123456','Diretoria','admin',0]);
    users.appendRow(['Carlos Andrade','carlos@email.com','123456','Órion','conselheiro',0]);
    users.appendRow(['Sofia Oliveira','sofia@email.com','123456','Plêiades','desbravador',225]);
    users.appendRow(['Gabriel Silva','gabriel@email.com','123456','Órion','desbravador',225]);
    users.appendRow(['Matheus Lima','matheus@email.com','123456','Órion','desbravador',115]);
    users.appendRow(['Julia Costa','julia@email.com','123456','Plêiades','desbravador',105]);
    users.appendRow(['Lucas Mendes','lucas@email.com','123456','Órion','desbravador',100]);
    users.appendRow(['Beatriz Santos','beatriz@email.com','123456','Plêiades','desbravador',90]);
  }

  const tx = getSheet_(SHEETS.transactions);
  if (tx.getLastRow() === 1) {
    tx.appendRow(['gabriel@email.com','Pontuação Semanal','+125 DBV','05/10/2026','']);
    tx.appendRow(['gabriel@email.com','Saldo Inicial','+100 DBV','01/10/2026','']);
    tx.appendRow(['sofia@email.com','Pontuação Semanal','+125 DBV','05/10/2026','']);
  }

  const products = getSheet_(SHEETS.products);
  if (products.getLastRow() === 1) {
    products.appendRow([1,'Prendedor de Lenço 3D - Calebe',150,10]);
    products.appendRow([2,'Pin - VI Campori DSA',200,15]);
    products.appendRow([3,'Trunfo Comemorativo',120,20]);
    products.appendRow([4,'Bússola de Bolso Aço Inox',250,5]);
    products.appendRow([5,'Chaveiro DBV Giratório',100,25]);
  }

  return json_({status:'success', message:'Banco configurado.'});
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    const action = p.action || 'get_all';

    if (action === 'login') {
      return login_(p.email, p.pass);
    }

    if (action === 'get_all') {
      return getAll_();
    }

    const data = p.data ? JSON.parse(p.data) : {};
    return handleAction_(action, data);
  } catch (err) {
    return json_({status:'error', message:String(err.message || err)});
  }
}

function handleAction_(action, data) {
  switch (action) {
    case 'add_unit': return addUnit_(data);
    case 'delete_unit': return deleteUnit_(data);
    case 'add_user': return addUser_(data);
    case 'delete_user': return deleteUser_(data);
    case 'add_transaction': return addTransaction_(data);
    case 'add_product': return addProduct_(data);
    case 'redeem_product': return redeemProduct_(data);
    default: return json_({status:'error', message:'Ação desconhecida: '+action});
  }
}

function getAll_() {
  setupHeaders_();
  return json_({
    status:'success',
    units: readObjects_(SHEETS.units),
    users: readObjects_(SHEETS.users).map(normalizeUser_),
    transactions: readObjects_(SHEETS.transactions),
    products: readObjects_(SHEETS.products).map(normalizeProduct_)
  });
}

function login_(email, pass) {
  setupHeaders_();
  const users = readObjects_(SHEETS.users).map(normalizeUser_);
  const user = users.find(u => String(u.email).toLowerCase() === String(email || '').toLowerCase()
                           && String(u.pass) === String(pass || ''));
  if (!user) return json_({status:'error', message:'E-mail ou senha incorretos!'});
  return json_({status:'success', user:user});
}

function addUnit_(data) {
  const name = String(data.name || '').trim();
  if (!name) throw new Error('Nome da unidade obrigatório.');
  if (readObjects_(SHEETS.units).some(x => String(x.name).toLowerCase() === name.toLowerCase()))
    throw new Error('Unidade já cadastrada.');
  getSheet_(SHEETS.units).appendRow([name]);
  return json_({status:'success'});
}

function deleteUnit_(data) {
  const name = String(data.name || '');
  const users = readObjects_(SHEETS.users);
  if (users.some(u => String(u.unit) === name))
    throw new Error('Existem membros vinculados a esta unidade.');
  const sh = getSheet_(SHEETS.units);
  const values = sh.getDataRange().getValues();
  for (let r=1;r<values.length;r++) {
    if (String(values[r][0]) === name) { sh.deleteRow(r+1); break; }
  }
  return json_({status:'success'});
}

function addUser_(data) {
  const email = String(data.email || '').toLowerCase().trim();
  if (!email) throw new Error('E-mail obrigatório.');
  if (readObjects_(SHEETS.users).some(u => String(u.email).toLowerCase() === email))
    throw new Error('E-mail já cadastrado.');
  getSheet_(SHEETS.users).appendRow([
    String(data.name || ''),
    email,
    String(data.pass || ''),
    String(data.unit || ''),
    String(data.role || 'desbravador'),
    Number(data.balance || 0)
  ]);
  return json_({status:'success'});
}

function deleteUser_(data) {
  const email = String(data.email || '').toLowerCase();
  const sh = getSheet_(SHEETS.users);
  const values = sh.getDataRange().getValues();
  for (let r=1;r<values.length;r++) {
    if (String(values[r][1]).toLowerCase() === email) {
      sh.deleteRow(r+1);
      return json_({status:'success'});
    }
  }
  throw new Error('Usuário não encontrado.');
}

function addTransaction_(data) {
  const email = String(data.userEmail || '').toLowerCase();
  const amountText = String(data.amount || '');
  const amount = parseInt(amountText.replace(/[^\-\d]/g,''),10) || 0;
  if (!email || !amount) throw new Error('Transação inválida.');

  const shUsers = getSheet_(SHEETS.users);
  const users = shUsers.getDataRange().getValues();
  let userRow = -1;

  for (let r=1;r<users.length;r++) {
    if (String(users[r][1]).toLowerCase() === email) {
      userRow = r+1;
      break;
    }
  }
  if (userRow < 0) throw new Error('Usuário não encontrado.');

  const currentBalance = Number(shUsers.getRange(userRow,6).getValue()) || 0;
  const newBalance = currentBalance + amount;
  if (newBalance < 0) throw new Error('Saldo não pode ficar negativo.');

  shUsers.getRange(userRow,6).setValue(newBalance);

  getSheet_(SHEETS.transactions).appendRow([
    email,
    String(data.desc || 'Movimentação'),
    amountText,
    String(data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')),
    String(data.productId || '')
  ]);

  return json_({status:'success'});
}

function addProduct_(data) {
  const id = Number(data.id) || Date.now();
  getSheet_(SHEETS.products).appendRow([
    id,
    String(data.name || ''),
    Number(data.price || 0),
    Number(data.stock || 0)
  ]);
  return json_({status:'success'});
}

function redeemProduct_(data) {
  const email = String(data.userEmail || '').toLowerCase();
  const productId = Number(data.productId);
  const cost = Number(String(data.amount || '').replace(/[^\-\d]/g,'')) || 0;

  if (!email || !productId || cost <= 0) throw new Error('Resgate inválido.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const shUsers = getSheet_(SHEETS.users);
    const users = shUsers.getDataRange().getValues();
    let userRow = -1;
    for (let r=1;r<users.length;r++) {
      if (String(users[r][1]).toLowerCase() === email) { userRow=r+1; break; }
    }
    if (userRow < 0) throw new Error('Usuário não encontrado.');

    const balance = Number(shUsers.getRange(userRow,6).getValue()) || 0;
    if (balance < cost) throw new Error('Saldo insuficiente.');

    const shProd = getSheet_(SHEETS.products);
    const products = shProd.getDataRange().getValues();
    let prodRow = -1;
    for (let r=1;r<products.length;r++) {
      if (Number(products[r][0]) === productId) { prodRow=r+1; break; }
    }
    if (prodRow < 0) throw new Error('Produto não encontrado.');

    const stock = Number(shProd.getRange(prodRow,4).getValue()) || 0;
    if (stock <= 0) throw new Error('Produto esgotado.');

    shUsers.getRange(userRow,6).setValue(balance-cost);
    shProd.getRange(prodRow,4).setValue(stock-1);

    getSheet_(SHEETS.transactions).appendRow([
      email,
      String(data.desc || 'Resgate Bazar'),
      '-' + cost + ' DBV',
      String(data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')),
      productId
    ]);

    return json_({status:'success'});
  } finally {
    lock.releaseLock();
  }
}

function normalizeUser_(u) {
  return {
    name:String(u.name || ''),
    email:String(u.email || ''),
    pass:String(u.pass || ''),
    unit:String(u.unit || ''),
    role:String(u.role || 'desbravador'),
    balance:Number(u.balance || 0)
  };
}

function normalizeProduct_(p) {
  return {
    id:Number(p.id || 0),
    name:String(p.name || ''),
    price:Number(p.price || 0),
    stock:Number(p.stock || 0)
  };
}

function setupHeaders_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.units, ['name']);
  ensureSheet_(ss, SHEETS.users, ['name','email','pass','unit','role','balance']);
  ensureSheet_(ss, SHEETS.transactions, ['userEmail','desc','amount','date','productId']);
  ensureSheet_(ss, SHEETS.products, ['id','name','price','stock']);
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  else {
    const first = sh.getRange(1,1,1,headers.length).getValues()[0];
    if (first.join('') === '') sh.getRange(1,1,1,headers.length).setValues([headers]);
  }
}

function getSheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Aba não encontrada: '+name);
  return sh;
}

function readObjects_(sheetName) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = row[i]);
    return obj;
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
