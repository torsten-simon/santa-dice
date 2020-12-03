<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

define("FILENAME","data.json");
define("FILE_LOCK","data.lock");

$fp = fopen(FILE_LOCK, "w+");

if (flock($fp, LOCK_EX)) {
	$action = @$_GET["action"];
	$data = json_decode(@file_get_contents(FILENAME));
	if($action == "reset"){
		foreach($data as $d){
			$d->number = null;
		}
		file_put_contents(FILENAME, json_encode($data));
	} else if($action == "delete"){
		@unlink(FILENAME);
	} else if ($action == "put"){
		$found = false;
		$diced = null;
		if(@$_GET["dice"]){
			$diced = [rand(1, 6), rand(1, 6)];
		}
		if($data){
			foreach($data as $d){
				if($d->name == $_GET["name"]){
					if($d->number){
						echo json_encode(["error" => "already diced"]);
					} else {
						$d->number = $diced;
					}
					$found = true;
					break;
				}
			}
		}
		if(!$found){
			$data[] = ["name" => $_GET["name"], "number" => $diced];
		}
		file_put_contents(FILENAME, json_encode($data));
	} else {
		echo json_encode($data);
	}
	flock($fp, LOCK_UN); // Gib Sperre frei
	@unlink(FILE_LOCK);
} else {
	echo json_encode(["error" => "lock failed"]);
}
fclose($fp);