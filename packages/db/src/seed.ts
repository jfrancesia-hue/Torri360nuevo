import { PrismaClient, UserRole, Plan, PropertyType, UnitType, ProviderStatus, Priority, TicketStatus, TicketSource, EventType, Visibility, AssetStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Toori360...');

  // ---- TENANT ----
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'inmobiliaria-demo' },
    update: {},
    create: {
      name: 'Inmobiliaria Demo',
      slug: 'inmobiliaria-demo',
      plan: Plan.PRO,
      onboardingCompleted: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant creado:', tenant.name);

  // ---- SLA CONFIGS ----
  const slaData = [
    { priority: Priority.CRITICAL, responseTimeHours: 2, resolutionTimeHours: 24 },
    { priority: Priority.HIGH, responseTimeHours: 4, resolutionTimeHours: 48 },
    { priority: Priority.MEDIUM, responseTimeHours: 8, resolutionTimeHours: 72 },
    { priority: Priority.LOW, responseTimeHours: 24, resolutionTimeHours: 168 },
  ];

  for (const sla of slaData) {
    await prisma.slaConfig.upsert({
      where: { tenantId_priority: { tenantId: tenant.id, priority: sla.priority } },
      update: {},
      create: { tenantId: tenant.id, ...sla },
    });
  }
  console.log('✅ SLA configs creados');

  // ---- USERS ----
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const usersData = [
    { email: 'admin@demo.com', name: 'Admin Demo', role: UserRole.ADMIN },
    { email: 'operador@demo.com', name: 'Operador Demo', role: UserRole.OPERATOR },
    { email: 'supervisor@demo.com', name: 'Supervisor Demo', role: UserRole.SUPERVISOR },
    { email: 'inquilino@demo.com', name: 'Juan Pérez', role: UserRole.REQUESTER },
    { email: 'proveedor@demo.com', name: 'Carlos Gómez', role: UserRole.PROVIDER_USER },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
      update: {},
      create: { tenantId: tenant.id, passwordHash, ...u },
    });
    users[u.role] = user;
  }
  console.log('✅ Usuarios creados (password: Demo1234!)');

  // ---- TRADES (RUBROS) ----
  const tradesData = [
    { name: 'Plomería', icon: 'droplets' },
    { name: 'Electricidad', icon: 'zap' },
    { name: 'Pintura', icon: 'paintbrush' },
    { name: 'Cerrajería', icon: 'key' },
    { name: 'Limpieza', icon: 'sparkles' },
    { name: 'Ascensores', icon: 'arrow-up-down' },
    { name: 'Gas', icon: 'flame' },
    { name: 'Albañilería', icon: 'brick-wall' },
    { name: 'Vidrios', icon: 'square' },
    { name: 'Aire Acondicionado', icon: 'wind' },
  ];

  const trades: Record<string, { id: string }> = {};
  for (const t of tradesData) {
    const trade = await prisma.trade.upsert({
      where: { id: `00000000-0000-0000-0000-${Buffer.from(t.name).toString('hex').slice(0, 12)}` },
      update: {},
      create: { tenantId: tenant.id, ...t },
    });
    trades[t.name] = trade;
  }

  // Re-fetch trades
  const allTrades = await prisma.trade.findMany({ where: { tenantId: tenant.id } });
  const tradeMap: Record<string, string> = {};
  allTrades.forEach((t) => { tradeMap[t.name] = t.id; });
  console.log('✅ Rubros creados');

  // ---- CATEGORIES ----
  const categoriesData = [
    { name: 'Reparación', icon: 'wrench' },
    { name: 'Mantenimiento', icon: 'settings' },
    { name: 'Emergencia', icon: 'alert-triangle' },
    { name: 'Instalación', icon: 'plus-circle' },
    { name: 'Inspección', icon: 'search' },
  ];

  for (const c of categoriesData) {
    await prisma.category.create({
      data: { tenantId: tenant.id, ...c },
    }).catch(() => {/* already exists */});
  }
  const allCategories = await prisma.category.findMany({ where: { tenantId: tenant.id } });
  const catMap: Record<string, string> = {};
  allCategories.forEach((c) => { catMap[c.name] = c.id; });
  console.log('✅ Categorías creadas');

  // ---- PROPERTIES ----
  const prop1 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      name: 'Edificio San Martín 450',
      address: 'San Martín 450, San Fernando del Valle de Catamarca',
      type: PropertyType.BUILDING,
      lat: -28.4696,
      lng: -65.7852,
      notes: 'Edificio de 5 pisos con subsuelo',
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      name: 'Complejo Residencial Norte',
      address: 'Av. Virgen del Valle 1200, Catamarca',
      type: PropertyType.COMPLEX,
      lat: -28.4500,
      lng: -65.7800,
      notes: 'Complejo de 3 torres con amenities',
    },
  });

  // ---- UNITS for prop1 ----
  const unitTypes: UnitType[] = ['APARTMENT', 'APARTMENT', 'APARTMENT', 'APARTMENT', 'APARTMENT',
    'APARTMENT', 'APARTMENT', 'APARTMENT', 'COMMON_AREA', 'PARKING'];
  const unitIdentifiers = ['Depto 1A', 'Depto 1B', 'Depto 2A', 'Depto 2B', 'Depto 3A',
    'Depto 3B', 'Depto 4A', 'Depto 4B', 'Salón Común', 'Cochera 1'];

  const unitsData: { id: string }[] = [];
  for (let i = 0; i < unitIdentifiers.length; i++) {
    const unit = await prisma.unit.create({
      data: {
        propertyId: prop1.id,
        identifier: unitIdentifiers[i],
        floor: i < 8 ? String(Math.floor(i / 2) + 1) : null,
        type: unitTypes[i],
        contactName: i < 8 ? `Inquilino ${i + 1}` : null,
        contactPhone: i < 8 ? `+54 383 4${String(i).padStart(6, '0')}` : null,
      },
    });
    unitsData.push(unit);
  }

  // Units for prop2
  for (let i = 1; i <= 10; i++) {
    await prisma.unit.create({
      data: {
        propertyId: prop2.id,
        identifier: `Torre A - Depto ${i}`,
        floor: String(i),
        type: UnitType.APARTMENT,
        contactName: `Residente ${i}`,
      },
    });
  }
  console.log('✅ Propiedades y unidades creadas');

  // ---- PROVIDERS ----
  const providersData = [
    {
      businessName: 'Plomeros Unidos SRL',
      contactName: 'Roberto Silva',
      phone: '+54 383 4123456',
      email: 'contacto@plomerosunidos.com',
      cuit: '30-12345678-9',
      avgRating: 4.5,
      totalJobs: 48,
      tradeNames: ['Plomería'],
    },
    {
      businessName: 'ElectroTech Catamarca',
      contactName: 'Miguel Torres',
      phone: '+54 383 4234567',
      email: 'miguel@electrotech.com',
      cuit: '20-23456789-0',
      avgRating: 4.8,
      totalJobs: 72,
      tradeNames: ['Electricidad'],
    },
    {
      businessName: 'Pinturas & Decoraciones Norte',
      contactName: 'Ana Rodríguez',
      phone: '+54 383 4345678',
      avgRating: 4.2,
      totalJobs: 35,
      tradeNames: ['Pintura', 'Albañilería'],
    },
    {
      businessName: 'Multiservicios Hogar',
      contactName: 'Carlos Gómez',
      phone: '+54 383 4456789',
      email: 'proveedor@demo.com',
      avgRating: 3.9,
      totalJobs: 20,
      tradeNames: ['Cerrajería', 'Electricidad'],
    },
    {
      businessName: 'ClimaTec AC',
      contactName: 'Laura Fernández',
      phone: '+54 383 4567890',
      email: 'laura@climatec.com',
      avgRating: 4.6,
      totalJobs: 55,
      tradeNames: ['Aire Acondicionado', 'Electricidad'],
    },
  ];

  const createdProviders: { id: string }[] = [];
  for (const p of providersData) {
    const { tradeNames, ...providerData } = p;
    const provider = await prisma.provider.create({
      data: {
        tenantId: tenant.id,
        status: ProviderStatus.ACTIVE,
        ...providerData,
      },
    });
    createdProviders.push(provider);

    for (const tradeName of tradeNames) {
      if (tradeMap[tradeName]) {
        await prisma.providerTrade.create({
          data: {
            providerId: provider.id,
            tradeId: tradeMap[tradeName],
            coverageZones: ['Centro', 'Norte', 'Sur'],
          },
        });
      }
    }
  }
  console.log('✅ Proveedores creados');

  // ---- TICKETS DE EJEMPLO ----
  const requester = users[UserRole.REQUESTER];
  const admin = users[UserRole.ADMIN];

  const ticketsData = [
    {
      title: 'Pérdida de agua en baño principal',
      description: 'Hay una pérdida de agua constante debajo del lavatorio del baño principal. Se nota humedad en el piso.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      propertyId: prop1.id,
      unitId: unitsData[0].id,
      providerId: createdProviders[0].id,
      categoryName: 'Reparación',
      tradeName: 'Plomería',
    },
    {
      title: 'Luz intermitente en pasillo',
      description: 'La luz del pasillo del 2do piso parpadea constantemente. Ya reemplazamos la bombilla pero persiste el problema.',
      status: TicketStatus.ASSIGNED,
      priority: Priority.MEDIUM,
      propertyId: prop1.id,
      unitId: unitsData[8].id,
      providerId: createdProviders[1].id,
      categoryName: 'Reparación',
      tradeName: 'Electricidad',
    },
    {
      title: 'Puerta de entrada no cierra correctamente',
      description: 'La puerta del departamento 3A no cierra bien, hay que forzarla. El cerrojo está dañado.',
      status: TicketStatus.AWAITING_QUOTE,
      priority: Priority.MEDIUM,
      propertyId: prop1.id,
      unitId: unitsData[4].id,
      categoryName: 'Reparación',
      tradeName: 'Cerrajería',
    },
    {
      title: 'Pintura deteriorada en entrada del edificio',
      description: 'La pintura de la entrada principal está muy deteriorada, con manchas de humedad y descascarada en varias zonas.',
      status: TicketStatus.PENDING_APPROVAL,
      priority: Priority.LOW,
      propertyId: prop1.id,
      categoryName: 'Mantenimiento',
      tradeName: 'Pintura',
    },
    {
      title: 'Corte de luz repentino en todo el edificio',
      description: 'Se fue la luz en todo el edificio sin previo aviso. El tablero principal no responde.',
      status: TicketStatus.CLOSED,
      priority: Priority.CRITICAL,
      propertyId: prop1.id,
      providerId: createdProviders[1].id,
      categoryName: 'Emergencia',
      tradeName: 'Electricidad',
    },
    {
      title: 'Aire acondicionado no enfría',
      description: 'El equipo de aire acondicionado del departamento 2B enciende pero no enfría. Hay un ruido raro al arrancar.',
      status: TicketStatus.QUOTE_RECEIVED,
      priority: Priority.HIGH,
      propertyId: prop1.id,
      unitId: unitsData[3].id,
      providerId: createdProviders[4].id,
      categoryName: 'Reparación',
      tradeName: 'Aire Acondicionado',
    },
    {
      title: 'Limpieza general de cisterna',
      description: 'La cisterna del edificio necesita limpieza y desinfección. Está programada para mantenimiento anual.',
      status: TicketStatus.SCHEDULING_VISIT,
      priority: Priority.LOW,
      propertyId: prop1.id,
      categoryName: 'Mantenimiento',
      tradeName: 'Plomería',
    },
    {
      title: 'Humedad en pared del sótano',
      description: 'Hay humedad visible en la pared norte del sótano. Se observan manchas de hongos en la pintura.',
      status: TicketStatus.IN_REVIEW,
      priority: Priority.HIGH,
      propertyId: prop2.id,
      categoryName: 'Inspección',
      tradeName: 'Albañilería',
    },
    {
      title: 'Instalación de cámara de seguridad',
      description: 'Se requiere instalar una cámara de seguridad adicional en el acceso vehicular del complejo.',
      status: TicketStatus.NEW,
      priority: Priority.MEDIUM,
      propertyId: prop2.id,
      categoryName: 'Instalación',
      tradeName: 'Electricidad',
    },
    {
      title: 'Gas con olor en cocina',
      description: 'Hay leve olor a gas en la cocina del departamento 4A. Ya se cerró la llave general como medida de precaución.',
      status: TicketStatus.RECEIVED,
      priority: Priority.CRITICAL,
      propertyId: prop1.id,
      unitId: unitsData[6].id,
      categoryName: 'Emergencia',
      tradeName: 'Gas',
    },
  ];

  const now = new Date();
  for (let i = 0; i < ticketsData.length; i++) {
    const t = ticketsData[i];
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const number = `TK-${yearMonth}-${String(i + 1).padStart(4, '0')}`;

    const slaConfig = await prisma.slaConfig.findUnique({
      where: { tenantId_priority: { tenantId: tenant.id, priority: t.priority } },
    });

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: tenant.id,
        number,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        propertyId: t.propertyId,
        unitId: t.unitId,
        requesterId: requester.id,
        assigneeId: t.providerId ? admin.id : undefined,
        providerId: t.providerId,
        categoryId: catMap[t.categoryName],
        tradeId: tradeMap[t.tradeName],
        slaConfigId: slaConfig?.id,
        slaDueAt: slaConfig
          ? new Date(now.getTime() + slaConfig.resolutionTimeHours * 3600000)
          : undefined,
        source: TicketSource.WEB,
        closedAt: t.status === TicketStatus.CLOSED ? new Date() : undefined,
      },
    });

    // Create initial event
    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        userId: requester.id,
        eventType: EventType.SYSTEM,
        data: { message: 'Ticket creado' },
        visibility: Visibility.ALL,
      },
    });

    // Status change event if not NEW
    if (t.status !== TicketStatus.NEW) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          userId: admin.id,
          eventType: EventType.STATUS_CHANGE,
          data: { from: 'NEW', to: t.status },
          visibility: Visibility.ALL,
        },
      });
    }
  }

  // ---- ASSETS ----
  const assetsData = [
    {
      propertyId: 'prop1',
      name: 'Bomba de agua principal',
      type: 'Hidráulico',
      brand: 'Grundfos',
      model: 'CM5-A',
      status: AssetStatus.ACTIVE,
      installDate: new Date('2021-03-15'),
      warrantyEnd: new Date('2024-03-15'),
      notes: 'Bomba centrífuga de presión constante',
    },
    {
      propertyId: 'prop1',
      name: 'Tablero eléctrico general',
      type: 'Eléctrico',
      brand: 'Schneider Electric',
      model: 'Prisma G',
      status: AssetStatus.ACTIVE,
      installDate: new Date('2020-06-01'),
      warrantyEnd: new Date('2025-06-01'),
      notes: 'Tablero principal de distribución 220V/380V',
    },
    {
      propertyId: 'prop1',
      name: 'Ascensor principal',
      type: 'Mecánico',
      brand: 'Otis',
      model: 'Gen2',
      status: AssetStatus.UNDER_MAINTENANCE,
      installDate: new Date('2019-01-20'),
      warrantyEnd: new Date('2022-01-20'),
      notes: 'En mantenimiento preventivo anual',
    },
    {
      propertyId: 'prop1',
      name: 'Sistema de incendio',
      type: 'Seguridad',
      brand: 'Bosch',
      model: 'FPA-5000',
      status: AssetStatus.ACTIVE,
      installDate: new Date('2020-09-10'),
      warrantyEnd: new Date('2025-09-10'),
      notes: 'Central de detección y alarma contra incendio',
    },
    {
      propertyId: 'prop2',
      name: 'Generador de emergencia',
      type: 'Eléctrico',
      brand: 'Perkins',
      model: '1106A-70TAG2',
      status: AssetStatus.INACTIVE,
      installDate: new Date('2018-11-05'),
      warrantyEnd: new Date('2021-11-05'),
      notes: 'Fuera de servicio - pendiente reparación',
    },
    {
      propertyId: 'prop2',
      name: 'Tanque de agua cisterna',
      type: 'Hidráulico',
      brand: null,
      model: null,
      status: AssetStatus.ACTIVE,
      installDate: new Date('2017-04-01'),
      warrantyEnd: null,
      notes: 'Capacidad 50.000 litros, revisión semestral',
    },
  ];

  for (const a of assetsData) {
    await prisma.asset.create({
      data: {
        propertyId: a.propertyId === 'prop1' ? prop1.id : prop2.id,
        name: a.name,
        type: a.type,
        brand: a.brand,
        model: a.model,
        status: a.status,
        installDate: a.installDate,
        warrantyEnd: a.warrantyEnd ?? undefined,
        notes: a.notes,
      },
    });
  }

  console.log('✅ Activos creados');

  // Initialize ticket sequence
  await prisma.ticketSequence.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      yearMonth: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
      sequence: ticketsData.length,
    },
  });

  console.log('✅ Tickets de ejemplo creados');
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   admin@demo.com / Demo1234! (Administrador)');
  console.log('   operador@demo.com / Demo1234! (Operador)');
  console.log('   supervisor@demo.com / Demo1234! (Supervisor)');
  console.log('   inquilino@demo.com / Demo1234! (Solicitante)');
  console.log('   proveedor@demo.com / Demo1234! (Proveedor)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
