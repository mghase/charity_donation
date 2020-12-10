var contractSource = `
payable contract CharitDonationContract =
      
    record org = {
        index      : int,
        owner_address: address,
        org_chain_name: string,
        org_name: string,
        location    : string,
        site_url : string,
        description : string,
        amount      : int
        }
               
    record state = {
        orgs : map(int,org),
        total: int
        }
          
    entrypoint init() = {
        orgs      = {},
        total = 0
        }
                      
                      
    stateful entrypoint registerOrg(name' : string, desc' : string, location' : string, site_url' : string) =
        let i  = getOrgTotal() + 1
        let org = {
            index  = i,
            owner_address = Call.caller,
            org_name = name',
            org_chain_name = "",
            location     = location',
            site_url     = site_url',
            description = desc',
            amount       = 0
            }
        put(state {orgs[i]=org, total = i})
                                            
                                            
                                            
    entrypoint getOrg(index : int): org =
        switch(Map.lookup(index, state.orgs))
           None => abort("There was no organization Found")
           Some(x) => x
       
       
    entrypoint getOrgTotal() : int =
        state.total 
        
      
        
    payable stateful entrypoint donate(index : int) =
        let org = getOrg(index)
        require(org.owner_address != Call.caller, "You cannot donate to your own Organization")
        Chain.spend(org.owner_address,Call.value)
        let updateAmount =org.amount+Call.value
        let updateOrgs =state.orgs{[index].amount = updateAmount }
        put(state {orgs = updateOrgs})              
`;
var contractAddress= "ct_2kTj5G8vkMMc4Zrke6rFTcR6epazN8UJYYdhpMqxefqATfjRZJ";

var client =null;

var orgsArray = [];
var orgTotal =0;

async function renderOrg() {
    var template=$('#template').html();
    Mustache.parse(template);
    var render = Mustache.render(template, {orgsArray});
    $('#org-list').html(render);
    childTotal = await callStatic('getOrgTotal', [])
    $('#total').html(orgTotal);
}

async function callStatic(func,args){
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{callStatic : true}).catch(e =>console.error(e))
    //console.log('calledGet',calledGet);

    const decodedGet = await calledGet.decode().catch(e =>console.error(e));
    //console.log(decodedGet)
    return decodedGet;
}

async function contractCall(func, args,value) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
   
    const calledGet =await contract.call(func,args,{amount : value}).catch(e =>console.error(e))

    return calledGet;
  }



window.addEventListener('load',async () =>{
    $('#loader').show();
    client = await Ae.Aepp();

    orgTotal = await callStatic('getOrgTotal', []);

    for (let i = 1; i <= orgTotal; i++) {
       const org = await callStatic('getOrg',[i]);

        orgsArray.push({
          index : org.index,
            owner_address: address,
        org_chain_name: string,
        org_name: string,
        location    : string,
        site_url : string,
        description : string,
        amount      : int

        })

        
    }

console.log(orgsArray);

    renderOrg()

$('#loader').hide();
$('#main').show();
});



$(document).on('click','#saveBtn', async function(){
    $('#loader').show();
    const name = $('#name').val();
    const location = $('#location').val();
    const url = $('#url').val();
    const desc = $('#desc').val();

         orgsArray.push({
             org_name            : name,
            location             :location,
            site_url             : url,
            description          : desc
           
 })

await contractCall('registerOrg',[name, desc,location,url], 0);

  renderOrg();
$('#loader').hide();
});


$('#org-list').on('click','.donateBtn', async function(e){
  $('#loader').show();
  
  const orgID = e.target.id;
  const amount = $('input[id='+orgID+']').val();
   console.log(orgID +"-"+amount)

await contractCall('donate',[orgID], amount);


location.reload((true));
renderOrg();
$('#loader').hide();
});

