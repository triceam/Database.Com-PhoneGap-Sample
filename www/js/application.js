document.addEventListener( "deviceready", onDeviceReady );

document.addEventListener( "touchend", function(event){
    //this function is used to prevent duplicate "tap" events
    var target = $( event.target )
    if (target.get(0).nodeName.toUpperCase() != "INPUT" && target.get(0).nodeName.toUpperCase() != "TEXTAREA") {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
});

var templates = {
    structure:"views/structure.html",
    home:"views/home.html",
    form:"views/formView.html",
    list:"views/dataView.html",
    listItem:"views/listItem.html",
    loaded: 0,
    requested: 0,
};

var header, container;
var sfw;
var lastCoords;
var lastData;
var currentLead;


/*  **************************************************
 *  INITIALIZATION/TEMPLATE LOADING
 *  **************************************************/

function onDeviceReady( event ) {
    console.log("deviceready");
    
    //initialize salesforce wrapper
    sfw = new SalesforceWrapper();
    
    //load Mousetache HTML templates
    for (var key in templates) {
        (function() {
            var _key = key.toString();
            if ( _key != "loaded" && _key != "requested" ){
                templates.requested ++;
         
                 var templateLoaded = function( template ){
                    onTemplateLoaded( template, _key );
                 }
                
                $.get( templates[ _key ], templateLoaded );
             }
         })();
    }
}

function onTemplateLoaded(template, key) {
    
    console.log( key + ": " + template);
    templates[ key ] = template;
    templates.loaded ++;
    
    if ( templates.loaded == templates.requested ) {
        setupDefaultView();
    }
}

/*  **************************************************
 *  DEFAULT VIEW/STRUCTURE LOGIC
 *  **************************************************/

function setupDefaultView() {
    console.log("setupDefaultView");
    $("body").html( templates.structure );
    header = $("body").find("#header");
    container = $("body").find("#content");
    
    $('#login').tap(function (e) {
        e.preventDefault();
        sfw.login( setupHomeView );
    });
}

function resetContainer() {
    //this removes child elements and cleans up event handlers
    container.children().remove();
    container.removeClass("nopadding");
}


/*  **************************************************
 *  HOME VIEW LOGIC
 *  **************************************************/

function setupHomeView() {
    resetContainer();
    container.html( templates.home );
    header.html( "Welcome" );
    
    $('#addNew').tap(function (e) {
        setupFormView();
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    
    
    $('#queryMyRecords').tap(function (e) {
        setupListView();
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
}


/*  **************************************************
 *  FORM VIEW LOGIC
 *  **************************************************/

function setupFormView(data) {
    resetContainer();    
    var html =  Mustache.to_html( templates.form, data ); 
    container.html( html );
    currentLead = data;
    
    //request current location
    if ( !(data && data.Id) ) {
        header.html( "New Lead" );
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError );
    }
    else {
        header.html( "Edit Lead" );
    }
        
    $('#save').tap( saveFormData );
    $('#cancel').tap( navigateBackFromFormView );
}

function saveFormData( event ) {
    
    var data = {};
    data.First__c = $("#first").val();
    data.Last__c = $("#last").val();
    data.Telephone__c = $("#phone").val();
    data.Email__c = $("#email").val();
    data.Notes__c = $("#notes").val();
    
    if ( currentLead ) {
        //copy it back to the object in memory
        currentLead.First__c = data.First__c;
        currentLead.Last__c = data.Last__c;
        currentLead.Telephone__c = data.Telephone__c;
        currentLead.Email__c = data.Email__c;
        currentLead.Notes__c = data.Notes__c;
        
        //use the original lat/lon location
        data.Latitude__c = currentLead.Latitude__c;
        data.Longitude__c = currentLead.Longitude__c;
    }
    else if ( lastCoords ) {
        data.Latitude__c = lastCoords.latitude;
        data.Longitude__c = lastCoords.longitude;
    }
    try {
        if ( currentLead == undefined ) {
            sfw.client.create("Lead__C", data, saveDataSuccess, saveDataError );
        } else {
            sfw.client.update("Lead__C", currentLead.Id, data, saveDataSuccess, saveDataError );
        }
    } 
    catch(e){
        console.log(e);
    }
}

function saveDataSuccess( result ) {
    alert("Data Saved");
    navigateBackFromFormView();
}

function saveDataError( request, status, error){ 
    console.log( request.responseText ); 
    alert( request.responseText );
}

function navigateBackFromFormView( event ) {
    currentLead = undefined;
    if(lastData) {
        setupListView();
    }
    else {
        setupHomeView();
    }
}

function onGeoSuccess( position ) {    
    lastCoords = position.coords;
    $("#location").html( "Location: " + lastCoords.latitude + ", " + lastCoords.longitude );
}

function onGeoError( error ) {
    
    $("#location").html( "Unable to determine location" );
    $("#location").removeClass("alert-info").addClass("alert-error");
    lastCoords = undefined;
}


/*  **************************************************
 *  LIST VIEW LOGIC
 *  **************************************************/

function setupListView() {
    resetContainer();
    
    var html = templates.list; 
    container.html( html );
    header.html( "Leads" );
    
    if(lastData) {
        renderListData();
    }
    else {
        queryRecords();
    }
    
    $('#cancel').tap( setupHomeView );
}

function renderListData() {
    if ( lastData ) {
        container.addClass("nopadding");
        var html = Mustache.to_html( templates.listItem, lastData ); 
        $("#dataContainer").html( html );
        $("#dataContainer").find("li").tap( onListItemTap );
        $("#cancel").tap( navigateBackFromListView );
    }
}

function onListItemTap( event ) {
    
    var target = $( event.target )
    while (target.get(0).nodeName.toUpperCase() != "LI") {
        target=target.parent();
    }
    var id = target.attr("id");
    
    var data = getRecordById(id);    
    setupFormView( data );
    
    event.preventDefault();
    event.stopPropagation();
    return false;
}

function navigateBackFromListView( event ) {
    
    lastData = undefined;
    setupHomeView();
}



/*  **************************************************
 *  DATA QUERY LOGIC
 *  **************************************************/

function queryRecords() {
    
    var query = "SELECT Email__c,First__c,Id,Last__c,Latitude__c,Longitude__c,Notes__c,Telephone__c "+
    "FROM Lead__c " + 
    "ORDER BY Last__c, First__c"
    
    sfw.client.query( query, onQuerySuccess, onQueryError );
}

function onQuerySuccess( response ) {
    
    lastData = { "records": response.records };
    renderListData();
}

function onQueryError( request, status, error ) {
    $("#dataContainer").html( "Error loading data: <br/>" + request.responseText );
}

function getRecordById( id ) {
    
    if ( !lastData  ) return;
    var records = lastData.records;
    
    for (var x=0; x<records.length; x++ ) {
        if (records[x].Id == id ) {
            return records[x];
        }
    }
}


