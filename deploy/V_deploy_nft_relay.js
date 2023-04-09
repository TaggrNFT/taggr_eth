const { ethers, getNamedAccounts, network: networkObj, run } = require('hardhat');

const {
  getDeployData,
  getContractAbi,
  saveDeploymentData,
} = require('../js-helpers/deploy');

const {
  executeTx,
} = require('../js-helpers/executeTx');

const {
  log,
  toWei,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const { verifyContract } = require('../js-helpers/verification');

const _ = require('lodash');


const CONTRACT_ABI = {
  '1': getContractAbi('TaggrNftRelay'),
};

const _deployNftRelay = async (project) => {
  log(`Taggr: Deploying NFT Relay for Project ${project.projectName}`);

  const NftRelay = await ethers.getContractFactory('TaggrNftRelay');
  const NftRelayInstance = await NftRelay.deploy();
  const nftRelay = await NftRelayInstance.deployed();
  const deployData = {};
  deployData[project.projectId] = {
    abi: CONTRACT_ABI[project.chainId],
    address: nftRelay.address,
    deployTransaction: nftRelay.deployTransaction,
  }
  saveDeploymentData(project.chainId, deployData);


  log(`Taggr: Initializing NFT Relay...`);
  const tx = await nftRelay.initialize(project.projectName, project.owner, project.nftDistributor, project.nftContract, project.nftHolder);
  await tx.wait();

  log(`Taggr: Mapping NFT Tokens for Relay...`);
  const tokenIds = project.tokenMap.map(tkn => tkn.tokenId);
  const nftTokenIds = project.tokenMap.map(tkn => tkn.nftTokenId);
  const limit = 20;
  while (tokenIds.length > 0) {
    const tokens = tokenIds.splice(0, limit);
    const nftTokens = nftTokenIds.splice(0, limit);
    log(` - Mapping ${tokens.length} tokens...`);
    const mapTx = await nftRelay.mapTokens(tokens, nftTokens);
    await mapTx.wait();
  }

  log(`Taggr: Deployment Complete!`);
  log(`   - New NFT Relay: ${nftRelay.address}`);
  log(`   - Deployment saved to: "deployments/${project.networkName}/${project.projectId}.json`);
};


module.exports = async () => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  const {isProd, isHardhat} = chainTypeById(chainId);
  let project;

  const ddNftDistributor = getDeployData('NftDistributor', chainId);
  log('  Referencing NftDistributor from: ', ddNftDistributor.address);

  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr - Deploy NFT Relay');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - Owner:             ', protocolOwner);
  log(' ');


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Project: Cortex Flight Crew
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  project = {
    projectId       : 'cortex-flight-crew',
    projectName     : 'Cortex Flight Crew',
    owner           : deployer,
    chainId,
    networkName,
    nftDistributor  : ddNftDistributor.address,
    nftContract     : '0x92939Fc66f67017832be6b279410a59cA6A42a20', // Cortex .APE Domains
    nftHolder       : '0x44D7954eB0AA72C0eD545223a5dF32B8e9D5EC46',
    tokenMap        : [
      { tokenId: '1', nftTokenId: '17562039148778764612572770047622968423501115745057332718438157501474391316391', name: '001.flightcrew.ape' },
      { tokenId: '2', nftTokenId: '69061421225608878168869360340623169679890071069721311229193789106413614953846', name: '002.flightcrew.ape' },
      { tokenId: '3', nftTokenId: '8859054732171345900252388067846465651496490394599747422912766672296062493790', name: '003.flightcrew.ape' },
      { tokenId: '4', nftTokenId: '74478882489274124333734912840267905479122828847464183876741133403642760771061', name: '004.flightcrew.ape' },
      { tokenId: '5', nftTokenId: '110421312957098384268666181681598901156761755825168699970420506218176932791323', name: '005.flightcrew.ape' },
      { tokenId: '6', nftTokenId: '39676974957684108738759650796204127445024824698720718233313434149165921047843', name: '006.flightcrew.ape' },
      { tokenId: '7', nftTokenId: '54719078348918489754306246017176500622899728903175119410538334027001497695183', name: '007.flightcrew.ape' },
      { tokenId: '8', nftTokenId: '61277980450812085350931405893468080379460087644827025558189558929949097496977', name: '008.flightcrew.ape' },
      { tokenId: '9', nftTokenId: '79054762959356929748081913267030926470249300792577359756884711487610064602267', name: '009.flightcrew.ape' },
      { tokenId: '10', nftTokenId: '90527214307008322259323982853868909024915787388331370418725738422015232793843', name: '010.flightcrew.ape' },
      { tokenId: '11', nftTokenId: '113419997333077967199544884257652157419437119964023443430093183958025489314651', name: '011.flightcrew.ape' },
      { tokenId: '12', nftTokenId: '80833894942196771927052088140007459711937379202537646077835927419144966504569', name: '012.flightcrew.ape' },
      { tokenId: '13', nftTokenId: '36760862160396790075880511604824312201367228968414151042356746803518050084312', name: '013.flightcrew.ape' },
      { tokenId: '14', nftTokenId: '71571093102197494980726688899332109919806277399635060488596627664464222890941', name: '014.flightcrew.ape' },
      { tokenId: '15', nftTokenId: '53233321629218116077471423324000401359757238890286130395088546046901893039781', name: '015.flightcrew.ape' },
      { tokenId: '16', nftTokenId: '77886093481860861274229030811362692574566558569825913379772901051747806208110', name: '016.flightcrew.ape' },
      { tokenId: '17', nftTokenId: '24372905650309245274009206087780513174746509885278507184919156566553057306854', name: '017.flightcrew.ape' },
      { tokenId: '18', nftTokenId: '15621311821204126140649277386080416074886780578150593016414460113356114223122', name: '018.flightcrew.ape' },
      { tokenId: '19', nftTokenId: '30919473736499877430676561296135014884425685089470039726303519282744599482510', name: '019.flightcrew.ape' },
      { tokenId: '20', nftTokenId: '74409008176616107651968529942692364899792795519724370615496630648298946160301', name: '020.flightcrew.ape' },
      { tokenId: '21', nftTokenId: '69188388405456034931039159776984388721448128790191766677244923223339099521839', name: '021.flightcrew.ape' },
      { tokenId: '22', nftTokenId: '28623001983433421281228599876223277763215305990687612016057708017691312122515', name: '022.flightcrew.ape' },
      { tokenId: '23', nftTokenId: '1336994852983222504106004921713246694571160480170491493699425851972927915244', name: '023.flightcrew.ape' },
      { tokenId: '24', nftTokenId: '74779034053554852994541705633673496278539636727236253928673503160410430985332', name: '024.flightcrew.ape' },
      { tokenId: '25', nftTokenId: '33026206873768579357961192958081491447643905959723846645582950873480714835020', name: '025.flightcrew.ape' },
      { tokenId: '26', nftTokenId: '101565825390563680265689127376696252011521283541544283779186254323026793801764', name: '026.flightcrew.ape' },
      { tokenId: '27', nftTokenId: '74289530475434087196230441004820708281986488656477302617279397316391212851710', name: '027.flightcrew.ape' },
      { tokenId: '28', nftTokenId: '96620736068234226427575008805672057330295030829295051079149920362743044111913', name: '028.flightcrew.ape' },
      { tokenId: '29', nftTokenId: '47992307872688979302766755314921346837163719043744292418795797387087663875189', name: '029.flightcrew.ape' },
      { tokenId: '30', nftTokenId: '12404341165539592524620277138100006567592030331086316993307952119379373458209', name: '030.flightcrew.ape' },
      { tokenId: '31', nftTokenId: '104475598079541816047160233623590191781752079914721993626512078753287431503746', name: '031.flightcrew.ape' },
      { tokenId: '32', nftTokenId: '71159977363048967998115208664169675845041015130362974909797470008922446590535', name: '032.flightcrew.ape' },
      { tokenId: '33', nftTokenId: '80444908073533197691606473090052159579028970975144232867384501265213336662210', name: '033.flightcrew.ape' },
      { tokenId: '34', nftTokenId: '25766290958143727324355076194296320783206570920965489460054450097011572373993', name: '034.flightcrew.ape' },
      { tokenId: '35', nftTokenId: '69649076004213135338998172876976049164766192281696773667294175096080776172485', name: '035.flightcrew.ape' },
      { tokenId: '36', nftTokenId: '49203941909703683421608185277725314676820111539940482420694314467854014883153', name: '036.flightcrew.ape' },
      { tokenId: '37', nftTokenId: '67358712277278528607487967776785302767864427952454546729764719121435372415076', name: '037.flightcrew.ape' },
      { tokenId: '38', nftTokenId: '11496481857034563864613007996747192417026011343740687737197870462333474367903', name: '038.flightcrew.ape' },
      { tokenId: '39', nftTokenId: '88851016889298197684615840968113124612863692091267448518130636778952777275102', name: '039.flightcrew.ape' },
      { tokenId: '40', nftTokenId: '57088929227345275066756252400939712821295392752263094733718816349892877228743', name: '040.flightcrew.ape' },
      { tokenId: '41', nftTokenId: '95400005108087355229448251882729116958080874045189667529795723802234974458626', name: '041.flightcrew.ape' },
      { tokenId: '42', nftTokenId: '57125886642414399182775957425988430058068438733925385161369459249060586870852', name: '042.flightcrew.ape' },
      { tokenId: '43', nftTokenId: '12677803538802644369133354861069072389351972689209364830040548710422346004624', name: '043.flightcrew.ape' },
      { tokenId: '44', nftTokenId: '23228931901650001458385490356769690835117718889110988603651123605704535526905', name: '044.flightcrew.ape' },
      { tokenId: '45', nftTokenId: '72122562546404028312482660599477120692309234725846732678197692283861024171275', name: '045.flightcrew.ape' },
      { tokenId: '46', nftTokenId: '114054282362581836510963799977254489468857755279750092568211425662598405377213', name: '046.flightcrew.ape' },
      { tokenId: '47', nftTokenId: '76933959008756844335966129688227328958263950463819817416809290829436314331424', name: '047.flightcrew.ape' },
      { tokenId: '48', nftTokenId: '6277019618056807849565323320200248662886125235603994042326776847109512367477', name: '048.flightcrew.ape' },
      { tokenId: '49', nftTokenId: '58060534192846219779040529565692807419372739451450448512456289342766852743441', name: '049.flightcrew.ape' },
      { tokenId: '50', nftTokenId: '24245691590744660223697724017318955387934075710797666738542138786398172953945', name: '050.flightcrew.ape' },
      { tokenId: '51', nftTokenId: '105692576939248671306656002238306318571122126227628123025369343794419713816255', name: '051.flightcrew.ape' },
      { tokenId: '52', nftTokenId: '5052659557573430547591601830562313287318734277534910930119361503308645455920', name: '052.flightcrew.ape' },
      { tokenId: '53', nftTokenId: '2636331278499768649332932155402867164249771678405975487343740158869120732989', name: '053.flightcrew.ape' },
      { tokenId: '54', nftTokenId: '24710074466742849565617890364839448692556928627868866673820701584228204024347', name: '054.flightcrew.ape' },
      { tokenId: '55', nftTokenId: '113729681482509796459688057979762163560719528394275208488043819025452252794283', name: '055.flightcrew.ape' },
      { tokenId: '56', nftTokenId: '24346988273157096357883895989185605785902942070155600865292250664065381185638', name: '056.flightcrew.ape' },
      { tokenId: '57', nftTokenId: '108525370584353463039959575050775997277222079195682173255773507026252943531220', name: '057.flightcrew.ape' },
      { tokenId: '58', nftTokenId: '17615454073947890206924935807812631814648956884209149269479331734424107413012', name: '058.flightcrew.ape' },
      { tokenId: '59', nftTokenId: '110991222061474731810045656985750700924714409551000755380678717676189359618126', name: '059.flightcrew.ape' },
      { tokenId: '60', nftTokenId: '34166943811757405809352856918494346181550970946133098932789326671614032441711', name: '060.flightcrew.ape' },
      { tokenId: '61', nftTokenId: '66471403661892139422618560812002831797109504634277715837183885483549272283539', name: '061.flightcrew.ape' },
      { tokenId: '62', nftTokenId: '105754911646349590814635348088207988240015489105959461507890342875927485145653', name: '062.flightcrew.ape' },
      { tokenId: '63', nftTokenId: '54903736774278986164087501620899578068056083512493533010948427846526202967684', name: '063.flightcrew.ape' },
      { tokenId: '64', nftTokenId: '90972408362366181634017442961118036556035797330658417354567496633237856019072', name: '064.flightcrew.ape' },
      { tokenId: '65', nftTokenId: '87803682224482672032267313597405633303572296435972635155363028013520232842719', name: '065.flightcrew.ape' },
      { tokenId: '66', nftTokenId: '30918281042525796896390217883417322623147350355116872003094027148467676726000', name: '066.flightcrew.ape' },
      { tokenId: '67', nftTokenId: '13841692250524988561747457488341355056452508147042802440829235718518722758877', name: '067.flightcrew.ape' },
      { tokenId: '68', nftTokenId: '69937536853553420458791108432612503873856729597364698336436833852173759958498', name: '068.flightcrew.ape' },
      { tokenId: '69', nftTokenId: '110086456688550683074272210151902058719338853880041292819822425410101595826479', name: '069.flightcrew.ape' },
      { tokenId: '70', nftTokenId: '54091069050377148484507913764183545619147069265087957274640586628186876717001', name: '070.flightcrew.ape' },
      { tokenId: '71', nftTokenId: '109439290790160952093550599268817154022259507788267059914308862910463753215826', name: '071.flightcrew.ape' },
      { tokenId: '72', nftTokenId: '62062478596721130020839837094742308490780799015070837627256972808001435442163', name: '072.flightcrew.ape' },
      { tokenId: '73', nftTokenId: '15311971551504950225990564621094034658665119327774274456070744306589306597385', name: '073.flightcrew.ape' },
      { tokenId: '74', nftTokenId: '98129320337737955426289383711067043436728606512215148759800741623377557462493', name: '074.flightcrew.ape' },
      { tokenId: '75', nftTokenId: '399359708825017973628381069741340268610622609929681361013455250478844836890', name: '075.flightcrew.ape' },
      { tokenId: '76', nftTokenId: '11558346043811864863101120222802144393939297386009817321484592882171124973528', name: '076.flightcrew.ape' },
      { tokenId: '77', nftTokenId: '21612991975337045795729384629694350493476504908373779533902919216314908789244', name: '077.flightcrew.ape' },
      { tokenId: '78', nftTokenId: '39183970096756325032475093858363825471929458652862161445584456380128062448633', name: '078.flightcrew.ape' },
      { tokenId: '79', nftTokenId: '113856118895056390446725065168033952071960643316817701649672446846950696866870', name: '079.flightcrew.ape' },
      { tokenId: '80', nftTokenId: '84237969421615021867646231739541143756610834992623173506006761297226645443751', name: '080.flightcrew.ape' },
      { tokenId: '81', nftTokenId: '98694867981570543216487254850287650749115632759961643265082602750935298304775', name: '081.flightcrew.ape' },
      { tokenId: '82', nftTokenId: '8708288373249522067923642099907526681119890155328911118595639619641359667642', name: '082.flightcrew.ape' },
      { tokenId: '83', nftTokenId: '15167675380841315755770356476547805890771441807574275044776640669849029163638', name: '083.flightcrew.ape' },
      { tokenId: '84', nftTokenId: '65263232655890632019993292549160272870305302954571793558833503459397428342461', name: '084.flightcrew.ape' },
      { tokenId: '85', nftTokenId: '82689428163313761455899518735072743268464859598697417460263115948532132288404', name: '085.flightcrew.ape' },
      { tokenId: '86', nftTokenId: '56822147173285740284645062890367141990139195586691521769069638408598320124036', name: '086.flightcrew.ape' },
      { tokenId: '87', nftTokenId: '5740941668083920603232787867172209973660860569368043350580710588466980205595', name: '087.flightcrew.ape' },
      { tokenId: '88', nftTokenId: '67965046902974824684332878789171508216401725830990104084920580173042256405520', name: '088.flightcrew.ape' },
      { tokenId: '89', nftTokenId: '33651945837930696999208099175454346078353546880082934932865386906876397744287', name: '089.flightcrew.ape' },
      { tokenId: '90', nftTokenId: '95611805718263674940522010042771733973936182693418830242909315918799877803314', name: '090.flightcrew.ape' },
      { tokenId: '91', nftTokenId: '62236105835798924080001948964135555169711233703070192129734484877813208777321', name: '091.flightcrew.ape' },
      { tokenId: '92', nftTokenId: '82849178850526759223796337700461162969905838096956565580311229302940186490477', name: '092.flightcrew.ape' },
      { tokenId: '93', nftTokenId: '16544634204612019006308948709884893525046192263998377256314384233990883358796', name: '093.flightcrew.ape' },
      { tokenId: '94', nftTokenId: '103847595625847983900290230957443730719397867396298978618789579367950368276079', name: '094.flightcrew.ape' },
      { tokenId: '95', nftTokenId: '39249204489843611683164361998972854365983753834697790000816520099443760583820', name: '095.flightcrew.ape' },
      { tokenId: '96', nftTokenId: '101224805204606184135363200773578761623724636523761769972871150698043968085490', name: '096.flightcrew.ape' },
      { tokenId: '97', nftTokenId: '14162989367558718794419159533151476911051212781653901907097921743116567342446', name: '097.flightcrew.ape' },
      { tokenId: '98', nftTokenId: '26499679412720609424932939626000893494474062543169629649093362064856259635404', name: '098.flightcrew.ape' },
      { tokenId: '99', nftTokenId: '11623359405981185039523508942702935913826115858849252791153318065946249318897', name: '099.flightcrew.ape' },
      { tokenId: '100', nftTokenId: '54764295951508596905748179548203865702462624516953145145219400176318339377018', name: '100.flightcrew.ape' },
      { tokenId: '101', nftTokenId: '10118716902798419874992100172293029002735242721448936051286527941709322088325', name: '101.flightcrew.ape' },
      { tokenId: '102', nftTokenId: '77851478154706587880030062490561095671180162740944489586800101967527335776854', name: '102.flightcrew.ape' },
      { tokenId: '103', nftTokenId: '99389668713538756205112600841421456629667424276947798583527593880021259555612', name: '103.flightcrew.ape' },
      { tokenId: '104', nftTokenId: '47067408596052422181524031777914244945684672872361995421360473369116138120155', name: '104.flightcrew.ape' },
      { tokenId: '105', nftTokenId: '40242703085418598429201229812286189855366263873786742818172759121058881462368', name: '105.flightcrew.ape' },
      { tokenId: '106', nftTokenId: '7585788989726496260342851279017384724609647998734583052689591501388989508069', name: '106.flightcrew.ape' },
      { tokenId: '107', nftTokenId: '4487844011585641522999982695412748322938487178731014468037736707470892301321', name: '107.flightcrew.ape' },
      { tokenId: '108', nftTokenId: '38296155463007534361997302479572670472807801005412969318812315793505705129162', name: '108.flightcrew.ape' },


    ],
  };
  await _deployNftRelay(project);

  log(`\n  Deployment Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['relay']
