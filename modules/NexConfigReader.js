// read config from old version of nex
import 'jquery';

export function NexConfigReader(url){
    return new Promise((resolve, reject)=>{
        if(url === undefined){
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            url = urlParams.get('scene');
        }
        if(!url){
            return reject("Need to specify <b>?scene=</b>")
        }
        $.getScript(url+ '/config.js', function() {
            var basis_angle_limit = -Math.PI;
            resolve({
                'url': url,
                'width': w,
                'height': h,
                'scale': scale,
                'layers': layers,
                'sublayers': sublayers,
                'planes': planes[0],
                'focal': f,
                'py': py,
                'px': px,
                'invz': invz,
                'offset': offset,
                'maxcol': maxcol,
                'extrinsics': extrinsics,
                'basis_angle_limit': basis_angle_limit,
                'boundary':{
                    'rads': rads,
                    'focal': focal,
                    'max_viewing_right': max_viewing_right,
                    'max_viewing_left': max_viewing_left,
                    'max_viewing_down': max_viewing_down,
                    'max_viewing_up': max_viewing_up
                }
            });
        }).catch(err=>{
            return reject("<b>404:</b> <a href='"+url+"/config.js' target=_blank>"+url+ '/config.js</a> is not found')
        });    
    })
}